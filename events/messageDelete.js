const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        const logsSystem = message.client.logsSystem;
        if (!logsSystem) return;
        
        // Obtenir l'exécuteur via l'audit log
        try {
            const fetchedLogs = await message.guild.fetchAuditLogs({
                limit: 1,
                type: 72 // MESSAGE_DELETE
            });
            
            const deletionLog = fetchedLogs.entries.first();
            let executor = null;
            
            if (deletionLog && 
                deletionLog.target?.id === message.author?.id &&
                deletionLog.createdTimestamp > (Date.now() - 5000)) {
                executor = deletionLog.executor;
            }
            
            await logsSystem.logMessageDelete(message, executor);
        } catch (error) {
            console.error('Erreur lors de la récupération des logs d\'audit pour la suppression de message:', error);
            await logsSystem.logMessageDelete(message, null);
        }
    },
};
