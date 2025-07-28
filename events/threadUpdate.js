const { Events } = require('discord.js');

module.exports = {
    name: Events.ThreadUpdate,
    async execute(oldThread, newThread) {
        // Vérifier que le système de logs est activé
        if (!newThread.client.logsSystem) return;
        
        // Logger la modification de post de forum
        await newThread.client.logsSystem.logThreadUpdate(oldThread, newThread);
    },
};
