function serialize(msg, conn) {
    if (!msg) return msg;
    if (!msg.message) return msg;

    // Detect message type (text, image, video, etc.)
    msg.type = Object.keys(msg.message)[0];
    
    // Handle view once or ephemeral messages
    if (msg.type === "ephemeralMessage") {
        msg.message = msg.message.ephemeralMessage.message;
        msg.type = Object.keys(msg.message)[0];
    }
    
    // Extract the actual text body from the message
    msg.body = msg.message?.conversation || 
               msg.message[msg.type]?.text || 
               msg.message[msg.type]?.caption || 
               "";
               
    return msg;
}

module.exports = { serialize };

