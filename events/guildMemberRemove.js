const { Events, AuditLogEvent } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const logsSystem = member.client.logsSystem;
        if (!logsSystem) return;
        
        // Vérifier si c'est un kick via l'audit log
        try {
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberKick
            });
            
            const kickLog = fetchedLogs.entries.first();
            
            if (kickLog && 
                kickLog.target?.id === member.user.id &&
                kickLog.createdTimestamp > (Date.now() - 5000)) {
                await logsSystem.logMemberKick(member, kickLog.executor, kickLog.reason);
            } else {
                await logsSystem.logMemberLeave(member);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des logs d\'audit pour le départ de membre:', error);
            await logsSystem.logMemberLeave(member);
        }
    },
};
