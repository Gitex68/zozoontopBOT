const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildUpdate,
    async execute(oldGuild, newGuild) {
        const logsSystem = newGuild.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logGuildUpdate(oldGuild, newGuild);
    },
};
