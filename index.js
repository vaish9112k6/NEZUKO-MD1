require("dotenv").config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  delay,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");
const express = require("express");
const pino = require("pino");
const { serialize } = require("./lib/serialize");
const { Message, Image, Sticker } = require("./lib/Base");
const events = require("./lib/event");
const config = require("./config");

require("events").EventEmitter.defaultMaxListeners = 500;

const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Nezuko-MD is alive"));
app.listen(port, () => console.log(`Web server running on port ${port}`));

async function startBot() {
  const sessionDir = "./lib/session";
  const sessionPath = `${sessionDir}/creds.json`;

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  if (!fs.existsSync(sessionPath) && config.SESSION_ID) {
    try {
      let b64 = config.SESSION_ID.startsWith("Nezuko~") 
        ? config.SESSION_ID.split('Nezuko~')[1] 
        : config.SESSION_ID;
        
      const decodedCreds = Buffer.from(b64, 'base64').toString('utf-8');
      fs.writeFileSync(sessionPath, decodedCreds);
      console.log("Session ID successfully decoded and saved ✅");
    } catch (err) {
      console.error("Failed to decode Session ID. Check Render Environment Variables.");
    }
  }

  console.log("Syncing Database...");
  await config.DATABASE.sync();

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir, pino({ level: "silent" }));

  if (!state.creds || !state.creds.registered) {
      console.error("CRITICAL: No valid session found. Please provide a valid SESSION_ID in Render Environment Variables.");
      return; 
  }

  const conn = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["Nezuko-MD", "Chrome", "1.0.0"],
    downloadHistory: false,
    syncFullHistory: false,
  });

  store.bind(conn.ev);
  setInterval(() => {
    store.writeToFile("./lib/store_db.json");
  }, 30 * 60 * 1000);

  conn.ev.on("connection.update", async (s) => {
    const { connection, lastDisconnect } = s;

    if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
      console.log("Connection closed, reconnecting...");
      startBot();
    }

    if (connection === "open") {
      console.log("Connected To Whatsapp ✅\nLoading Plugins...");

      if (fs.existsSync("./plugins")) {
        fs.readdirSync("./plugins").forEach((plugin) => {
          if (path.extname(plugin).toLowerCase() === ".js") {
            require("./plugins/" + plugin);
          }
        });
      }
      
      console.log(`Plugins Loaded ✅ Total: ${events.commands.length}`);

      const str = `*㋚ ɴᴇᴢᴜᴋᴏ ꜱᴛᴀʀᴛᴇᴅ*\n\n*⌑ ᴩʟᴜɢɪɴꜱ* : *${events.commands.length}* \n*⌑ ᴡᴏʀᴋ ᴛʏᴩᴇ* : *${config.WORK_TYPE}*`;
      if (conn.user?.id) {
        conn.sendMessage(conn.user.id, { text: str });
      }

      conn.ev.on("creds.update", saveCreds);

      conn.ev.on("messages.upsert", async (m) => {
        if (m.type !== "notify") return;
        const ms = m.messages[0];
        
        const msg = ms; 
        msg.from = ms.key.remoteJid;
        msg.sender = ms.key.participant || ms.key.remoteJid;
        const text_msg = ms.message?.conversation || ms.message?.extendedTextMessage?.text || "";

        for (const command of events.commands) {
          if (command.fromMe && config.WORK_TYPE === 'private' && !ms.key.fromMe) continue;

          if (text_msg && command.pattern && command.pattern.test(text_msg)) {
            let match = text_msg.replace(command.pattern, "").trim();
            const whats = new Message(conn, msg, ms);
            command.function(whats, match, msg, conn);
          } 
        }
      });
    }
  });
}

startBot();
