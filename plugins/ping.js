const events = require("../lib/event");

events.addCommand({
    pattern: /ping/i, 
    fromMe: false, // Set to true if you only want the bot owner to use it
    desc: "Checks the bot latency"
}, async (message, match) => {
    const start = new Date().getTime();
    await message.reply("```Testing ping...```");
    const end = new Date().getTime();
    
    await message.reply(`*Pong!* 🏓\nLatency: ${end - start} ms`);
});

