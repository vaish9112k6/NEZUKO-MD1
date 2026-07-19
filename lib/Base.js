class Message {
    constructor(client, msg, raw) {
        this.client = client;
        this.msg = msg;
        this.raw = raw;
        this.from = msg.from || raw.key.remoteJid;
        this.sender = msg.sender || raw.key.participant || raw.key.remoteJid;
    }

    async reply(text) {
        return await this.client.sendMessage(
            this.from, 
            { text: text }, 
            { quoted: this.raw }
        );
    }
}

class Image extends Message {}
class Sticker extends Message {}

module.exports = { Message, Image, Sticker };

