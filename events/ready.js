const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Pret! Connecté à ${client.user.tag}!`);
        
        // Rafraîchir le système de tickets au démarrage
        if (client.ticketSystem) {
            try {
                await client.ticketSystem.refreshTicketMessage();
                console.log('✅ Système de tickets initialisé');
            } catch (error) {
                console.log('⚠️ Système de tickets non configuré ou erreur:', error.message);
            }
        }

        // Initialiser le système de salons vocaux
        if (client.voiceSystem) {
            console.log('✅ Système de salons vocaux initialisé');
        }

        // Initialiser le système de logs
        if (client.logsSystem) {
            console.log('✅ Système de logs initialisé');
        }
    },
};