const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsync')
        .setDescription('Rafraîchit le menu de création de tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const ticketSystem = interaction.client.ticketSystem;

            if (!ticketSystem.config.createChannelId) {
                return await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Configuration manquante',
                        'Canal de création de tickets non configuré. Utilisez `/ticketsetup` d\'abord.'
                    )],
                    ephemeral: true
                });
            }

            const channel = interaction.guild.channels.cache.get(ticketSystem.config.createChannelId);
            if (!channel) {
                return await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        'Canal de création de tickets introuvable.'
                    )],
                    ephemeral: true
                });
            }

            // Rafraîchir le message
            const success = await ticketSystem.refreshTicketMessage();

            if (success) {
                const embed = EmbedManager.createSuccessEmbed(
                    'Menu rafraîchi',
                    'Le menu de création de tickets a été rafraîchi avec succès!'
                );

                embed.addFields(
                    {
                        name: 'Canal',
                        value: channel.toString(),
                        inline: true
                    },
                    {
                        name: 'ID du message',
                        value: ticketSystem.config.ticketMessageId,
                        inline: true
                    }
                );

                await interaction.reply({
                    embeds: [embed]
                });
            } else {
                await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        'Impossible de rafraîchir le menu de tickets.'
                    )],
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement du menu:', error);
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
