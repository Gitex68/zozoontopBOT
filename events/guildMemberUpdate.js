const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        const logsSystem = newMember.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logMemberUpdate(oldMember, newMember);
    },
};
