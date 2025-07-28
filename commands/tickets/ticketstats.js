const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketstats')
        .setDescription('Affiche les statistiques du système de tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const ticketSystem = interaction.client.ticketSystem;

            const activeTicketsCount = ticketSystem.activeTickets.size;
            const archivedTicketsCount = ticketSystem.archivedTickets.size;
            const totalTickets = activeTicketsCount + archivedTicketsCount;

            const embed = EmbedManager.createEmbed({
                title: '📊 Statistiques des Tickets',
                description: 'Voici un aperçu du système de tickets du serveur.',
                fields: [
                    {
                        name: '🎫 Tickets actifs',
                        value: activeTicketsCount.toString(),
                        inline: true
                    },
                    {
                        name: '📁 Tickets archivés',
                        value: archivedTicketsCount.toString(),
                        inline: true
                    },
                    {
                        name: '📈 Total des tickets',
                        value: totalTickets.toString(),
                        inline: true
                    }
                ],
                timestamp: new Date()
            });

            // Ajouter des informations sur la configuration
            let configStatus = '';
            configStatus += ticketSystem.config.categoryId ? '✅ Catégorie configurée\n' : '❌ Catégorie non configurée\n';
            configStatus += ticketSystem.config.createChannelId ? '✅ Canal de création configuré\n' : '❌ Canal de création non configuré\n';
            configStatus += ticketSystem.config.logChannelId ? '✅ Canal de logs configuré\n' : '❌ Canal de logs non configuré\n';
            configStatus += ticketSystem.ticketReasons.length > 0 ? `✅ ${ticketSystem.ticketReasons.length} raisons configurées\n` : '❌ Aucune raison configurée\n';

            embed.addFields({
                name: '⚙️ Configuration',
                value: configStatus,
                inline: false
            });

            // Lister les tickets actifs si il y en a
            if (activeTicketsCount > 0) {
                let activeList = '';
                let count = 0;
                for (const [channelId, ticketData] of ticketSystem.activeTickets) {
                    if (count >= 5) {
                        activeList += `... et ${activeTicketsCount - 5} autre(s)`;
                        break;
                    }
                    const channel = interaction.guild.channels.cache.get(channelId);
                    const owner = interaction.guild.members.cache.get(ticketData.owner);
                    if (channel && owner) {
                        activeList += `• ${channel} - ${owner.user.username}\n`;
                        count++;
                    }
                }

                if (activeList) {
                    embed.addFields({
                        name: '🎫 Tickets actifs (5 premiers)',
                        value: activeList,
                        inline: false
                    });
                }
            }

            embed.setFooter({
                text: 'Utilisez /ticketsetup pour configurer le système si nécessaire'
            });

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage des statistiques:', error);
            await interaction.reply({
                embeds: [EmbedManager.createErrorEmbed(
                    'Erreur',
                    `Une erreur est survenue: ${error.message}`
                )],
                ephemeral: true
            });
        }
    }
};
