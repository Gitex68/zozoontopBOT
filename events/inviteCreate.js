const { Events } = require('discord.js');

module.exports = {
    name: Events.InviteCreate,
    async execute(invite) {
        // Vérifier que le système de logs est activé
        if (!invite.client.logsSystem) return;
        
        // Logger la création d'invitation
        await invite.client.logsSystem.logInviteCreate(invite);
    },
};
