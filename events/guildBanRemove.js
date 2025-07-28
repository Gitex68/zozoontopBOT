const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildBanRemove,
    async execute(ban) {
        const logsSystem = ban.client.logsSystem;
        if (!logsSystem) return;
        
        try {
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanRemove
            });
            
            const unbanLog = fetchedLogs.entries.first();
            let executor = null;
            
            if (unbanLog && 
                unbanLog.target?.id === ban.user.id &&
                unbanLog.createdTimestamp > (Date.now() - 5000)) {
                executor = unbanLog.executor;
            }
            
            await logsSystem.logUnban(ban.guild, ban.user, executor);
        } catch (error) {
            console.error('Erreur lors de la récupération des logs d\'audit pour le débannissement:', error);
            await logsSystem.logUnban(ban.guild, ban.user, null);
        }
    },
};
