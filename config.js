require('dotenv').config();

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "",
    HANDLERS: process.env.PREFIX || "^[.]", // Default prefix is a dot (.)
    WORK_TYPE: process.env.WORK_TYPE || "public", // "public" or "private"
    LOGS: process.env.LOGS || true,
    SUDO: process.env.SUDO || "", 
    
    // Stub for database sync to prevent the main file from crashing
    DATABASE: {
        sync: async () => {
            console.log("Database synced locally");
        }
    }
};

