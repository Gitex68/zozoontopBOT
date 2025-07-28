const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban) {
        const logsSystem = ban.client.logsSystem;
        if (!logsSystem) return;
        
        try {
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanAdd
            });
            
            const banLog = fetchedLogs.entries.first();
            let executor = null;
            let reason = ban.reason;
            
            if (banLog && 
                banLog.target?.id === ban.user.id &&
                banLog.createdTimestamp > (Date.now() - 5000)) {
                executor = banLog.executor;
                reason = banLog.reason || ban.reason;
            }
            
            await logsSystem.logBan(ban.guild, ban.user, executor, reason);
        } catch (error) {
            console.error('Erreur lors de la récupération des logs d\'audit pour le bannissement:', error);
            await logsSystem.logBan(ban.guild, ban.user, null, ban.reason);
        }
    },
};
