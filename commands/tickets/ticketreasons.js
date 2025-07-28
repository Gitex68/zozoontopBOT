const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketreasons')
        .setDescription('Configure les raisons disponibles pour les tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const ticketSystem = interaction.client.ticketSystem;

            // Créer un modal pour configurer les raisons
            const modal = new ModalBuilder()
                .setCustomId('ticket_reasons_modal')
                .setTitle('Configuration des raisons de tickets');

            // Champ pour le nombre de raisons
            const reasonsCountInput = new TextInputBuilder()
                .setCustomId('reasons_count')
                .setLabel('Nombre de raisons (1-5)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(1)
                .setPlaceholder('3')
                .setRequired(true);

            // Champ pour les raisons (format JSON simplifié)
            const reasonsInput = new TextInputBuilder()
                .setCustomId('reasons_data')
                .setLabel('Raisons (une par ligne: emoji label description)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('❓ Assistance générale Demande d\'aide générale\n🚨 Signalement Signaler un problème\n💡 Suggestion Proposer une idée')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(reasonsCountInput);
            const secondActionRow = new ActionRowBuilder().addComponents(reasonsInput);

            modal.addComponents(firstActionRow, secondActionRow);

            await interaction.showModal(modal);

            // Attendre la soumission du modal
            const submitted = await interaction.awaitModalSubmit({
                time: 60000,
                filter: i => i.user.id === interaction.user.id,
            }).catch(error => {
                console.error('Erreur lors de l\'attente du modal:', error);
                return null;
            });

            if (submitted) {
                const reasonsCount = parseInt(submitted.fields.getTextInputValue('reasons_count'));
                const reasonsData = submitted.fields.getTextInputValue('reasons_data');

                if (isNaN(reasonsCount) || reasonsCount < 1 || reasonsCount > 5) {
                    return await submitted.reply({
                        embeds: [EmbedManager.createErrorEmbed(
                            'Erreur',
                            'Le nombre de raisons doit être entre 1 et 5.'
                        )],
                        ephemeral: true
                    });
                }

                // Parser les raisons
                const lines = reasonsData.split('\n').filter(line => line.trim());
                const newReasons = [];

                for (let i = 0; i < Math.min(reasonsCount, lines.length); i++) {
                    const parts = lines[i].trim().split(' ');
                    if (parts.length >= 3) {
                        const emoji = parts[0];
                        const label = parts[1];
                        const description = parts.slice(2).join(' ');

                        newReasons.push({
                            emoji,
                            label,
                            description: description.substring(0, 100)
                        });
                    }
                }

                if (newReasons.length === 0) {
                    return await submitted.reply({
                        embeds: [EmbedManager.createErrorEmbed(
                            'Erreur',
                            'Aucune raison valide trouvée. Format attendu: `emoji label description`'
                        )],
                        ephemeral: true
                    });
                }

                // Sauvegarder les nouvelles raisons
                ticketSystem.ticketReasons = newReasons;
                ticketSystem.saveConfig();

                // Mettre à jour le message de tickets
                await ticketSystem.refreshTicketMessage();

                const embed = EmbedManager.createSuccessEmbed(
                    'Raisons configurées',
                    `${newReasons.length} raisons de tickets ont été configurées avec succès!`
                );

                let reasonsList = '';
                for (const reason of newReasons) {
                    reasonsList += `${reason.emoji} **${reason.label}** - ${reason.description}\n`;
                }

                embed.addFields({
                    name: 'Raisons configurées',
                    value: reasonsList,
                    inline: false
                });

                await submitted.reply({
                    embeds: [embed]
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors de la configuration des raisons:', error);
            
            if (!interaction.replied && !interaction.deferred) {
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
