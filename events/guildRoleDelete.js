const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildRoleDelete,
    async execute(role) {
        const logsSystem = role.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logRoleDelete(role);
    },
};
