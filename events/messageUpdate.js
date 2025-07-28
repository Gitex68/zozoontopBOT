const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        const logsSystem = newMessage.client.logsSystem;
        if (!logsSystem) return;
        
        // Ignorer les messages partiels
        if (oldMessage.partial || newMessage.partial) return;
        
        await logsSystem.logMessageEdit(oldMessage, newMessage);
    },
};
