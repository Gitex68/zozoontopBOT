const { Events } = require('discord.js');

module.exports = {
    name: Events.UserUpdate,
    async execute(oldUser, newUser) {
        // Pour chaque guild où le bot est présent avec cet utilisateur
        for (const guild of newUser.client.guilds.cache.values()) {
            try {
                const member = await guild.members.fetch(newUser.id);
                if (member) {
                    const logsSystem = newUser.client.logsSystem;
                    if (logsSystem && logsSystem.config.guildId === guild.id) {
                        await logsSystem.logUserUpdate(oldUser, newUser);
                        break; // Une seule fois par utilisateur même s'il est sur plusieurs serveurs
                    }
                }
            } catch (error) {
                // L'utilisateur n'est pas sur ce serveur
            }
        }
    },
};
