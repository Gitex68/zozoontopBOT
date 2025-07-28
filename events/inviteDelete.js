const { Events } = require('discord.js');

module.exports = {
    name: Events.InviteDelete,
    async execute(invite) {
        // Vérifier que le système de logs est activé
        if (!invite.client.logsSystem) return;
        
        // Logger la suppression d'invitation
        await invite.client.logsSystem.logInviteDelete(invite);
    },
};
