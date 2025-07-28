const { Events } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Vérifier que le bot est prêt
        if (!newState.client.voiceSystem) return;
        
        // Déléguer la gestion au système de voix
        await newState.client.voiceSystem.handleVoiceStateUpdate(oldState, newState);
    },
};
