const { Events } = require('discord.js');

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel) {
        const logsSystem = channel.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logChannelDelete(channel);
    },
};
