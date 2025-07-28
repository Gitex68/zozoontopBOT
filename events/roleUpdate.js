const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildRoleUpdate,
    async execute(oldRole, newRole) {
        if (!newRole.client.logsSystem) return;
        
        await newRole.client.logsSystem.logRoleUpdate(oldRole, newRole);
    },
};
