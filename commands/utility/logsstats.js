const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logsstats')
        .setDescription('Affiche les statistiques et la configuration du système de logs')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const logsSystem = interaction.client.logsSystem;
            
            if (!logsSystem) {
                return await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        'Le système de logs n\'est pas initialisé.'
                    )],
                    ephemeral: true
                });
            }

            const guild = interaction.guild;
            const logsChannel = await logsSystem.getLogsChannel();
            
            const embed = EmbedManager.createEmbed({
                title: '📊 Statistiques du système de logs',
                description: 'Voici la configuration actuelle du système de logs.',
                timestamp: new Date()
            });

            // État du système
            let systemStatus = '';
            systemStatus += logsChannel ? '✅ Salon de logs configuré\n' : '❌ Salon de logs non configuré\n';
            systemStatus += logsSystem.config.guildId === guild.id ? '✅ Serveur configuré\n' : '❌ Serveur non configuré\n';

            embed.addFields({
                name: '⚙️ Configuration',
                value: systemStatus,
                inline: false
            });

            if (logsChannel) {
                embed.addFields({
                    name: '📋 Salon de logs',
                    value: logsChannel.toString(),
                    inline: true
                });
            }

            // Événements surveillés
            const events = logsSystem.config.enabledEvents;
            let eventsStatus = '';
            eventsStatus += `${events.moderation ? '✅' : '❌'} Modération (bans, kicks, mutes)\n`;
            eventsStatus += `${events.members ? '✅' : '❌'} Membres (arrivées, départs, rôles)\n`;
            eventsStatus += `${events.channels ? '✅' : '❌'} Salons (création, suppression, modifications)\n`;
            eventsStatus += `${events.messages ? '✅' : '❌'} Messages (édition, suppression)\n`;
            eventsStatus += `${events.roles ? '✅' : '❌'} Rôles (création, suppression, modifications)\n`;
            eventsStatus += `${events.server ? '✅' : '❌'} Serveur (nom, icône)`;

            embed.addFields({
                name: '📝 Événements surveillés',
                value: eventsStatus,
                inline: false
            });

            // Instructions
            if (!logsChannel) {
                embed.addFields({
                    name: '🔧 Pour commencer',
                    value: 'Utilisez `/logssetup` pour configurer le système de logs.',
                    inline: false
                });
                embed.setColor('#ffc107');
            } else {
                embed.setColor('#28a745');
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage des statistiques des logs:', error);
            await interaction.reply({
                embeds: [EmbedManager.createErrorEmbed(
                    'Erreur',
                    'Une erreur est survenue lors de l\'affichage des statistiques.'
                )],
                ephemeral: true
            });
        }
    }
};
