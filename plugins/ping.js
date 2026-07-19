const events = require("../lib/event");

events.addCommand({
    pattern: /ping/i, 
    fromMe: false, 
    desc: "Checks the bot latency"
}, async (message, match) => {
    // React immediately to show the bot is responsive
    await message.react("⚡");

    const start = new Date().getTime();
    
    // Send initial message
    const sentMsg = await message.reply("```Pinging...```");
    
    const end = new Date().getTime();
    const ping = end - start;

    // The exact format you requested
    const finalResponse = `*P O N G* !\n\`\`\`${ping} MS\`\`\``;

    // Edit the message for that fast, premium feel
    await message.client.sendMessage(message.from, { 
        text: finalResponse, 
        edit: sentMsg.key 
    });
    
    // Update reaction
    await message.react("✅");
});
