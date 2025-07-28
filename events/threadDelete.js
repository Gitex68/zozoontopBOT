const { Events } = require('discord.js');

module.exports = {
    name: Events.ThreadDelete,
    async execute(thread) {
        // Vérifier que le système de logs est activé
        if (!thread.client.logsSystem) return;
        
        // Logger la suppression de post de forum
        await thread.client.logsSystem.logThreadDelete(thread);
    },
};
