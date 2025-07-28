const { Events } = require('discord.js');

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel) {
        const logsSystem = channel.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logChannelCreate(channel);
    },
};
