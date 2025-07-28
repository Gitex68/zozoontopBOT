const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logssetup')
        .setDescription('Configure le système de logs du serveur')
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Le salon où envoyer les logs (optionnel, en créera un nouveau si non spécifié)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const guild = interaction.guild;
            const logsSystem = interaction.client.logsSystem;
            
            if (!logsSystem) {
                return await interaction.editReply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        'Le système de logs n\'est pas initialisé.'
                    )]
                });
            }

            let logsChannel = interaction.options.getChannel('salon');
            
            // Si aucun salon spécifié, créer un nouveau salon de logs
            if (!logsChannel) {
                try {
                    logsChannel = await guild.channels.create({
                        name: '📋-logs',
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: guild.roles.everyone,
                                deny: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages
                                ]
                            },
                            {
                                id: interaction.client.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.EmbedLinks,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            }
                        ]
                    });
                    
                    console.log(`✅ Salon de logs créé: ${logsChannel.name}`);
                } catch (error) {
                    return await interaction.editReply({
                        embeds: [EmbedManager.createErrorEmbed(
                            'Erreur de création',
                            `Impossible de créer le salon de logs: ${error.message}`
                        )]
                    });
                }
            }
            
            // Configurer le système de logs
            logsSystem.config.logsChannelId = logsChannel.id;
            logsSystem.config.guildId = guild.id;
            logsSystem.saveConfig();
            
            // Envoyer un message de test dans le salon de logs
            const testEmbed = EmbedManager.createEmbed({
                title: '📋 Système de Logs Activé',
                description: 'Le système de logs a été configuré avec succès!\nTous les événements du serveur seront enregistrés ici.',
                fields: [
                    {
                        name: '🔧 Modération',
                        value: 'Bannissements, mutes, suppressions de messages',
                        inline: true
                    },
                    {
                        name: '📁 Membres',
                        value: 'Arrivées, départs, changements de pseudo/rôles',
                        inline: true
                    },
                    {
                        name: '📝 Serveur',
                        value: 'Modifications de salons, rôles, serveur',
                        inline: true
                    }
                ],
                timestamp: new Date(),
                color: '#00ff00'
            });
            
            await logsChannel.send({ embeds: [testEmbed] });
            
            // Réponse de confirmation
            const successEmbed = EmbedManager.createSuccessEmbed(
                'Système de logs configuré',
                `Le système de logs a été configuré avec succès!`
            );
            
            successEmbed.addFields(
                {
                    name: '📋 Salon de logs',
                    value: logsChannel.toString(),
                    inline: true
                },
                {
                    name: '🎯 État',
                    value: 'Actif et fonctionnel',
                    inline: true
                },
                {
                    name: '📊 Événements surveillés',
                    value: '• Modération et administration\n• Gestion des membres\n• Gestion des salons et serveur\n• Messages (édition/suppression)',
                    inline: false
                }
            );
            
            await interaction.editReply({ embeds: [successEmbed] });
            
            console.log(`✅ Système de logs configuré par ${interaction.user.username} dans ${guild.name}`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la configuration des logs:', error);
            
            const embed = EmbedManager.createErrorEmbed(
                'Erreur',
                'Une erreur est survenue lors de la configuration du système de logs.'
            );
            
            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};
