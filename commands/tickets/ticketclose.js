const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketclose')
        .setDescription('Ferme le ticket actuel')
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('Raison de la fermeture du ticket')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('force')
                .setDescription('Fermer directement sans confirmation')
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

            const reason = interaction.options.getString('raison') || 'Non spécifiée';
            const force = interaction.options.getBoolean('force') || false;

            // Si force est activé ou qu'une raison est fournie, fermer directement
            if (force || interaction.options.getString('raison')) {
                await ticketSystem.closeTicket(interaction, ticketData.ticketId, reason);
                return;
            }

            // Sinon, proposer des options simples
            const quickCloseButton = new ButtonBuilder()
                .setCustomId(`quick_close_cmd_${ticketData.ticketId}`)
                .setLabel('Fermeture rapide')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚡');

            const withReasonButton = new ButtonBuilder()
                .setCustomId(`with_reason_cmd_${ticketData.ticketId}`)
                .setLabel('Avec raison')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝');

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel_cmd')
                .setLabel('Annuler')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌');

            const row = new ActionRowBuilder().addComponents(quickCloseButton, withReasonButton, cancelButton);

            const embed = EmbedManager.createWarningEmbed(
                'Options de fermeture',
                'Comment souhaitez-vous fermer ce ticket ?'
            );

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

        } catch (error) {
            console.error('❌ Erreur lors de la fermeture du ticket:', error);
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
