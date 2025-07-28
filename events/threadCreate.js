const { Events } = require('discord.js');

module.exports = {
    name: Events.ThreadCreate,
    async execute(thread) {
        // Vérifier que le système de logs est activé
        if (!thread.client.logsSystem) return;
        
        // Logger la création de post de forum
        await thread.client.logsSystem.logThreadCreate(thread);
    },
};
