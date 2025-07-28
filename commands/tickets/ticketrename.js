const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketrename')
        .setDescription('Renomme le ticket actuel')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Le nouveau nom du ticket')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
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

            const newName = interaction.options.getString('nom');
            const oldName = interaction.channel.name;

            // Nettoyer le nom pour le format Discord
            const cleanName = newName.trim().toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 50);

            if (!cleanName) {
                return await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Nom invalide',
                        'Veuillez fournir un nom valide pour le ticket.'
                    )],
                    ephemeral: true
                });
            }

            // Renommer le canal
            await interaction.channel.setName(cleanName);

            const embed = EmbedManager.createSuccessEmbed(
                'Ticket renommé',
                `Ticket renommé de \`${oldName}\` à \`${cleanName}\``
            );

            await interaction.reply({
                embeds: [embed]
            });

            console.log(`Ticket renommé par ${interaction.user.username}: ${oldName} → ${cleanName}`);

        } catch (error) {
            console.error('❌ Erreur lors du renommage du ticket:', error);
            
            if (error.code === 50013) {
                await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Permission refusée',
                        'Je n\'ai pas la permission de renommer ce canal.'
                    )],
                    ephemeral: true
                });
            } else if (error.code === 50035) {
                await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Nom invalide',
                        'Le nom fourni n\'est pas valide pour un canal Discord.'
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
