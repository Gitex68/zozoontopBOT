const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildRoleUpdate,
    async execute(oldRole, newRole) {
        const logsSystem = newRole.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logRoleUpdate(oldRole, newRole);
    },
};
