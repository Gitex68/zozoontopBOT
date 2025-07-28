const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Configure le système de tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            const guild = interaction.guild;
            const ticketSystem = interaction.client.ticketSystem;

            // Créer la catégorie de tickets si elle n'existe pas
            let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({
                    name: 'Tickets',
                    type: ChannelType.GuildCategory
                });
                ticketSystem.config.categoryId = category.id;
            } else {
                ticketSystem.config.categoryId = category.id;
            }

            // Créer le canal de création de tickets
            let createChannel = guild.channels.cache.find(c => c.name === 'créer-un-ticket' && c.parentId === category.id);
            if (!createChannel) {
                createChannel = await guild.channels.create({
                    name: 'créer-un-ticket',
                    type: ChannelType.GuildText,
                    parent: category
                });
                ticketSystem.config.createChannelId = createChannel.id;
            } else {
                ticketSystem.config.createChannelId = createChannel.id;
            }

            // Créer le canal de logs
            let logsChannel = guild.channels.cache.find(c => c.name === 'ticket-logs' && c.parentId === category.id);
            if (!logsChannel) {
                logsChannel = await guild.channels.create({
                    name: 'ticket-logs',
                    type: ChannelType.GuildText,
                    parent: category,
                    topic: 'Logs des actions sur les tickets',
                    permissionOverwrites: [
                        {
                            id: guild.id, // @everyone
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.client.user.id, // Bot
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages
                            ]
                        }
                    ]
                });

                // Ajouter les permissions pour les administrateurs
                const adminRoles = guild.roles.cache.filter(role => 
                    role.permissions.has(PermissionFlagsBits.Administrator)
                );

                for (const [, role] of adminRoles) {
                    await logsChannel.permissionOverwrites.create(role, {
                        ViewChannel: true,
                        SendMessages: true
                    });
                }

                ticketSystem.config.logChannelId = logsChannel.id;
                await interaction.followUp({
                    embeds: [EmbedManager.createInfoEmbed(
                        'Canal de logs créé',
                        `📋 Canal de logs de tickets créé: ${logsChannel}`
                    )],
                    ephemeral: true
                });
            } else {
                ticketSystem.config.logChannelId = logsChannel.id;
            }

            // Créer la catégorie d'archives (optionnel)
            let archiveCategory = guild.channels.cache.find(c => c.name === 'Archives Tickets' && c.type === ChannelType.GuildCategory);
            if (!archiveCategory) {
                archiveCategory = await guild.channels.create({
                    name: 'Archives Tickets',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.id, // @everyone
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.client.user.id, // Bot
                            allow: [PermissionFlagsBits.ViewChannel]
                        }
                    ]
                });

                // Ajouter les permissions pour les administrateurs
                const adminRoles = guild.roles.cache.filter(role => 
                    role.permissions.has(PermissionFlagsBits.Administrator)
                );

                for (const [, role] of adminRoles) {
                    await archiveCategory.permissionOverwrites.create(role, {
                        ViewChannel: true
                    });
                }

                ticketSystem.config.archiveCategoryId = archiveCategory.id;
            } else {
                ticketSystem.config.archiveCategoryId = archiveCategory.id;
            }

            // Sauvegarder la configuration
            ticketSystem.saveConfig();

            // Créer et envoyer le message de tickets
            await ticketSystem.refreshTicketMessage();

            // Réponse de confirmation
            const embed = EmbedManager.createSuccessEmbed(
                'Système de tickets configuré',
                'Le système de tickets a été mis en place avec succès!'
            );

            embed.addFields(
                {
                    name: 'Catégorie',
                    value: `**${category.name}**`,
                    inline: true
                },
                {
                    name: 'Canal de création',
                    value: createChannel.toString(),
                    inline: true
                },
                {
                    name: 'Canal de logs',
                    value: logsChannel.toString(),
                    inline: true
                }
            );

            embed.setFooter({
                text: 'Utilisez /ticketreasons pour configurer les raisons des tickets'
            });

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error('❌ Erreur lors de la configuration des tickets:', error);
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
