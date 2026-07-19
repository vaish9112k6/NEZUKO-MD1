const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeCacheableSignalKeyStore 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PREFIX = process.env.PREFIX || '!';

// Express server to keep Render happy
app.get('/', (req, res) => res.send('Bot is running properly!'));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));

// Session Decoder Logic
const sessionDir = path.join(__dirname, 'session_auth');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

const sessionId = process.env.SESSION_ID;
if (sessionId && sessionId.startsWith('Nezuko~')) {
    const credsPath = path.join(sessionDir, 'creds.json');
    if (!fs.existsSync(credsPath)) {
        console.log('Decoding session ID...');
        const base64Data = sessionId.split('Nezuko~')[1];
        const decodedCreds = Buffer.from(base64Data, 'base64').toString('utf-8');
        fs.writeFileSync(credsPath, decodedCreds);
    }
} else if (!fs.existsSync(path.join(sessionDir, 'creds.json'))) {
    console.error('CRITICAL: No valid SESSION_ID found in environment variables.');
}

// Spam Protection Tracker
const spamMap = new Map();

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Nezuko-MD", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('Logged out. Please generate a new SESSION_ID.');
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        } else if (connection === 'open') {
            console.log('Bot successfully connected to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const messageType = Object.keys(msg.message)[0];
        const text = msg.message.conversation || 
                     msg.message[messageType]?.text || 
                     msg.message[messageType]?.caption || '';

        // Spam Detection System
        const now = Date.now();
        if (!spamMap.has(sender)) spamMap.set(sender, []);
        
        const userTimestamps = spamMap.get(sender);
        userTimestamps.push(now);
        
        const recentMessages = userTimestamps.filter(t => now - t < 10000);
        spamMap.set(sender, recentMessages);

        if (recentMessages.length > 6) {
            console.log(`Spam detected from ${sender}. Blocking user.`);
            await sock.updateBlockStatus(sender, 'block');
            spamMap.delete(sender); 
            return; 
        }

        // Command Handler
        if (text.startsWith(PREFIX)) {
            const args = text.slice(PREFIX.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            if (command === 'ping') {
                await sock.sendMessage(sender, { text: 'Pong! 🏓 Nezuko is active.' }, { quoted: msg });
            }

            if (command === 'menu') {
                const menuText = `*NEZUKO-MD MENU*\n\nPrefix: [ ${PREFIX} ]\n\n- ${PREFIX}ping\n- ${PREFIX}menu\n\n_More features coming soon..._`;
                await sock.sendMessage(sender, { text: menuText }, { quoted: msg });
            }
            
            // Add more commands here following the same structure
        }
    });
}

startBot();

