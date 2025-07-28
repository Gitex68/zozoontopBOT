const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketadd')
        .setDescription('Ajoute un utilisateur au ticket actuel')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à ajouter au ticket')
                .setRequired(true)
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

            const member = interaction.options.getMember('utilisateur');
            if (!member) {
                return await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        'Utilisateur introuvable sur ce serveur.'
                    )],
                    ephemeral: true
                });
            }

            // Ajouter l'utilisateur au ticket
            await interaction.channel.permissionOverwrites.create(member, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
                EmbedLinks: true
            });

            const embed = EmbedManager.createSuccessEmbed(
                'Utilisateur ajouté',
                `${member} a été ajouté au ticket.`
            );

            await interaction.reply({
                embeds: [embed]
            });

            // Mentionner l'utilisateur ajouté
            await interaction.followUp({
                content: `👋 Bienvenue ${member} dans ce ticket!`
            });

            console.log(`${interaction.user.username} a ajouté ${member.user.username} au ticket ${interaction.channel.name}`);

        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de l\'utilisateur:', error);
            
            if (error.code === 50013) {
                await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Permission refusée',
                        'Je n\'ai pas la permission d\'ajouter cet utilisateur au ticket.'
                    )],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        `Une erreur est survenue: ${error.message}`
                    )],
                    ephemeral: true
                });
            }
        }
    }
};
