const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Ferme immédiatement le ticket actuel')
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('Raison rapide de la fermeture')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        try {
            const ticketSystem = interaction.client.ticketSystem;
            const ticketData = ticketSystem.activeTickets.get(interaction.channel.id);

            if (!ticketData) {
                return await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        'Ce salon n\'est pas un ticket actif.'
                    )],
                    ephemeral: true
                });
            }

            // Vérifier si c'est le propriétaire du ticket ou un admin
            const isOwner = ticketData.owner === interaction.user.id;
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

            if (!isOwner && !isAdmin) {
                return await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Permission refusée',
                        'Seul le créateur du ticket ou un administrateur peut fermer ce ticket.'
                    )],
                    ephemeral: true
                });
            }

            const reason = interaction.options.getString('raison') || 'Fermeture express';

            // Fermeture immédiate
            await ticketSystem.closeTicket(interaction, ticketData.ticketId, reason);

        } catch (error) {
            console.error('❌ Erreur lors de la fermeture express du ticket:', error);
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
