const events = require("../lib/event");

events.addCommand({
    pattern: /ping/i, 
    fromMe: false, 
    desc: "Checks the bot latency"
}, async (message, match) => {
    const start = new Date().getTime();
    
    const sentMsg = await message.reply("```Pinging...```");
    
    const end = new Date().getTime();
    const ping = end - start;

    const finalResponse = `*P O N G* !\n\`\`\`${ping} MS\`\`\``;

    await message.client.sendMessage(message.from, { 
        text: finalResponse, 
        edit: sentMsg.key 
    });
});
