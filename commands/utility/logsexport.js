const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logsexport')
        .setDescription('Exporte les logs du serveur sur une période donnée')
        .addIntegerOption(option =>
            option.setName('duree')
                .setDescription('Durée à exporter')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(720)
        )
        .addStringOption(option =>
            option.setName('unite')
                .setDescription('Unité de temps')
                .setRequired(true)
                .addChoices(
                    { name: 'Heures', value: 'heures' },
                    { name: 'Jours', value: 'jours' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const logsSystem = interaction.client.logsSystem;
            if (!logsSystem) {
                return await interaction.editReply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        'Le système de logs n\'est pas initialisé.'
                    )]
                });
            }

            if (!logsSystem.config.logsChannelId) {
                return await interaction.editReply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Logs non configurés',
                        'Le système de logs n\'est pas encore configuré. Utilisez `/logssetup` d\'abord.'
                    )]
                });
            }

            const duree = interaction.options.getInteger('duree');
            const unite = interaction.options.getString('unite');
            
            let timeValue, timeUnit, timeInMs;
            
            if (unite === 'heures') {
                timeValue = duree;
                timeUnit = 'heures';
                timeInMs = duree * 60 * 60 * 1000;
                
                // Validation pour les heures (max 720 = 30 jours)
                if (duree > 720) {
                    return await interaction.editReply({
                        embeds: [EmbedManager.createErrorEmbed(
                            'Durée trop importante',
                            'Le maximum pour les heures est de 720 (30 jours).'
                        )]
                    });
                }
            } else {
                timeValue = duree;
                timeUnit = 'jours';
                timeInMs = duree * 24 * 60 * 60 * 1000;
                
                // Validation pour les jours (max 30)
                if (duree > 30) {
                    return await interaction.editReply({
                        embeds: [EmbedManager.createErrorEmbed(
                            'Durée trop importante',
                            'Le maximum pour les jours est de 30.'
                        )]
                    });
                }
            }

            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - timeInMs);

            // Exporter les logs
            const exportData = logsSystem.exportLogs(startDate, endDate);
            
            if (exportData === 'Aucun log trouvé pour cette période.') {
                return await interaction.editReply({
                    embeds: [EmbedManager.createWarningEmbed(
                        'Aucun log trouvé',
                        `Aucun événement n'a été trouvé dans les ${timeValue} dernières ${timeUnit}.`
                    )]
                });
            }

            // Créer le fichier
            const buffer = Buffer.from(exportData, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { 
                name: `logs_${interaction.guild.name}_${timeValue}${timeUnit}_${new Date().toISOString().split('T')[0]}.txt` 
            });

            const embed = EmbedManager.createSuccessEmbed(
                '📋 Export des logs',
                `Export des logs des ${timeValue} dernières ${timeUnit} généré avec succès !`
            );

            embed.addFields(
                { name: '⏰ Période', value: `${startDate.toLocaleString('fr-FR')} - ${endDate.toLocaleString('fr-FR')}`, inline: false },
                { name: '📊 Événements exportés', value: `${(exportData.match(/\[/g) || []).length} événements`, inline: true },
                { name: '📁 Taille du fichier', value: `${(buffer.length / 1024).toFixed(2)} KB`, inline: true }
            );

            await interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });

            console.log(`✅ Export des logs généré par ${interaction.user.username} (${timeValue} ${timeUnit})`);

        } catch (error) {
            console.error('❌ Erreur lors de l\'export des logs:', error);
            
            const embed = EmbedManager.createErrorEmbed(
                'Erreur d\'export',
                'Une erreur est survenue lors de l\'export des logs.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};
