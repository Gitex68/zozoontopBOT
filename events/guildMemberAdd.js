const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const logsSystem = member.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logMemberJoin(member);
    },
};
