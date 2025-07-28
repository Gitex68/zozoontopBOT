const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildRoleCreate,
    async execute(role) {
        if (!role.client.logsSystem) return;
        
        await role.client.logsSystem.logRoleCreate(role);
    },
};
