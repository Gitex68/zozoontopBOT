const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildRoleCreate,
    async execute(role) {
        const logsSystem = role.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logRoleCreate(role);
    },
};
