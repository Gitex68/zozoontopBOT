const { Events } = require('discord.js');

module.exports = {
    name: Events.ChannelUpdate,
    async execute(oldChannel, newChannel) {
        const logsSystem = newChannel.client.logsSystem;
        if (!logsSystem) return;
        
        await logsSystem.logChannelUpdate(oldChannel, newChannel);
    },
};
