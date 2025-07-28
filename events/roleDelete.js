const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildRoleDelete,
    async execute(role) {
        if (!role.client.logsSystem) return;
        
        await role.client.logsSystem.logRoleDelete(role);
    },
};
