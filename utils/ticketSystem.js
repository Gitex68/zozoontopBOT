const { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const EmbedManager = require('./embedManager');

class TicketSystem {
    constructor(client) {
        this.client = client;
        this.activeTickets = new Map();
        this.archivedTickets = new Map();
        this.configFile = path.join(__dirname, '../data/ticket_config.json');
        this.archiveFile = path.join(__dirname, '../data/archived_tickets.json');
        this.ticketReasons = [];
        this.config = {
            categoryId: null,
            createChannelId: null,
            logChannelId: null,
            ticketMessageId: null,
            archiveCategoryId: null
        };
        
        this.loadConfig();
        this.loadArchivedTickets();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.config = { ...this.config, ...data };
                this.activeTickets = new Map(Object.entries(data.activeTickets || {}));
                this.ticketReasons = data.ticketReasons || [];
                console.log('✅ Configuration des tickets chargée');
            } else {
                console.log('⚠️ Aucune configuration de tickets trouvée');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la configuration des tickets:', error);
        }
    }

    loadArchivedTickets() {
        try {
            if (fs.existsSync(this.archiveFile)) {
                const data = JSON.parse(fs.readFileSync(this.archiveFile, 'utf8'));
                this.archivedTickets = new Map(Object.entries(data));
                console.log(`✅ ${this.archivedTickets.size} tickets archivés chargés`);
            } else {
                console.log('⚠️ Aucun ticket archivé trouvé');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des tickets archivés:', error);
        }
    }

    saveConfig() {
        try {
            const dir = path.dirname(this.configFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const configData = {
                ...this.config,
                activeTickets: Object.fromEntries(this.activeTickets),
                ticketReasons: this.ticketReasons
            };

            fs.writeFileSync(this.configFile, JSON.stringify(configData, null, 4));
            console.log('✅ Configuration des tickets sauvegardée');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde de la configuration des tickets:', error);
        }
    }

    saveArchivedTickets() {
        try {
            const dir = path.dirname(this.archiveFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const archiveData = Object.fromEntries(this.archivedTickets);
            fs.writeFileSync(this.archiveFile, JSON.stringify(archiveData, null, 4));
            console.log('✅ Tickets archivés sauvegardés');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des tickets archivés:', error);
        }
    }

    createTicketEmbed() {
        return EmbedManager.createEmbed({
            title: '🎫 Système de Tickets',
            description: 'Besoin d\'aide ? Une question ? Un problème ?\nCréez un ticket en sélectionnant une raison dans le menu ci-dessous.',
            fields: [
                {
                    name: '📜 Instructions',
                    value: '1. Sélectionnez la raison de votre ticket dans le menu\n2. Décrivez votre problème dans le salon créé\n3. Un membre du staff vous répondra dès que possible',
                    inline: false
                }
            ],
            footer: {
                text: 'Support · Utilisez le menu déroulant pour ouvrir un ticket'
            }
        });
    }

    createTicketSelectMenu() {
        const options = [
            new StringSelectMenuOptionBuilder()
                .setLabel('Choisir')
                .setValue('no_action')
                .setDescription('Sélectionnez une option pour créer un ticket')
                .setDefault(true)
        ];

        const reasons = this.ticketReasons.length > 0 ? this.ticketReasons : [
            { label: 'Assistance générale', emoji: '❓', description: 'Demande d\'aide générale' },
            { label: 'Signalement', emoji: '🚨', description: 'Signaler un problème' },
            { label: 'Suggestion', emoji: '💡', description: 'Proposer une idée ou suggestion' },
            { label: 'Autre', emoji: '📝', description: 'Autre demande' }
        ];

        for (const reason of reasons) {
            const option = new StringSelectMenuOptionBuilder()
                .setLabel(reason.label)
                .setValue(reason.label.toLowerCase().replace(/\s+/g, '_'))
                .setDescription(reason.description?.substring(0, 100) || '');
            
            if (reason.emoji) {
                option.setEmoji(reason.emoji);
            }
            
            options.push(option);
        }

        return new StringSelectMenuBuilder()
            .setCustomId(`ticket_reason_select_${Date.now()}`) // Rendre l'ID unique pour éviter les conflits
            .setPlaceholder('Sélectionnez la raison de votre ticket...')
            .addOptions(options);
    }

    createTicketControlButtons(ticketId) {
        return [
            new ButtonBuilder()
                .setCustomId(`close_ticket_${ticketId}`)
                .setLabel('Fermer le ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒'),
            
            new ButtonBuilder()
                .setCustomId(`close_ticket_quick_${ticketId}`)
                .setLabel('Fermeture rapide')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⚡'),
            
            new ButtonBuilder()
                .setCustomId(`add_user_${ticketId}`)
                .setLabel('Ajouter un utilisateur')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('➕')
        ];
    }

    async createTicket(interaction, reason) {
        try {
            // Vérifier si l'utilisateur a déjà un ticket ouvert
            const existingTicket = Array.from(this.activeTickets.values())
                .find(ticket => ticket.owner === interaction.user.id);
            
            if (existingTicket) {
                const channel = interaction.guild.channels.cache.get(existingTicket.channelId);
                if (channel) {
                    return await interaction.reply({
                        embeds: [EmbedManager.createErrorEmbed(
                            'Ticket déjà ouvert',
                            `Vous avez déjà un ticket ouvert : ${channel}`
                        )],
                        ephemeral: true
                    });
                }
            }

            const category = interaction.guild.channels.cache.get(this.config.categoryId);
            if (!category) {
                return await interaction.reply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Configuration manquante',
                        'La catégorie de tickets n\'est pas configurée.'
                    )],
                    ephemeral: true
                });
            }

            // Créer le nom du canal
            const channelName = `ticket-${interaction.user.username}`.toLowerCase()
                .replace(/[^a-z0-9-]/g, '').substring(0, 50);

            // Créer le canal de ticket
            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category,
                topic: `Ticket de ${interaction.user.tag} - Raison: ${reason}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id, // @everyone
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id, // Créateur du ticket
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    },
                    {
                        id: this.client.user.id, // Bot
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Ajouter les permissions pour les administrateurs
            const adminRoles = interaction.guild.roles.cache.filter(role => 
                role.permissions.has(PermissionFlagsBits.Administrator)
            );

            for (const [, role] of adminRoles) {
                await ticketChannel.permissionOverwrites.create(role, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageChannels: true
                });
            }

            const ticketId = `${channelName}-${Date.now()}`;

            // Enregistrer le ticket
            this.activeTickets.set(ticketChannel.id, {
                ticketId,
                owner: interaction.user.id,
                channelId: ticketChannel.id,
                reason,
                createdAt: new Date().toISOString()
            });

            this.saveConfig();

            // Créer l'embed de bienvenue
            const welcomeEmbed = EmbedManager.createEmbed({
                title: `🎫 Ticket créé - ${reason}`,
                description: `Bienvenue ${interaction.user}!\n\nVotre ticket a été créé avec succès. Décrivez votre problème en détail et un membre du staff vous répondra dès que possible.`,
                fields: [
                    {
                        name: '🏷️ Raison',
                        value: reason,
                        inline: true
                    },
                    {
                        name: '🆔 ID du ticket',
                        value: ticketId,
                        inline: true
                    },
                    {
                        name: '⏰ Créé le',
                        value: `<t:${Math.floor(Date.now() / 1000)}:f>`,
                        inline: true
                    }
                ],
                footer: {
                    text: 'Utilisez les boutons ci-dessous pour gérer ce ticket'
                },
                timestamp: new Date()
            });

            // Créer les boutons de contrôle
            const buttons = this.createTicketControlButtons(ticketId);
            const row = new ActionRowBuilder().addComponents(buttons);

            // Envoyer le message de bienvenue
            const welcomeMessage = await ticketChannel.send({
                content: `${interaction.user}`,
                embeds: [welcomeEmbed],
                components: [row]
            });

            // Mettre à jour les données du ticket avec l'ID du message de contrôle
            const ticketData = this.activeTickets.get(ticketChannel.id);
            ticketData.controlMessageId = welcomeMessage.id;
            this.activeTickets.set(ticketChannel.id, ticketData);
            this.saveConfig();

            // Répondre à l'interaction
            await interaction.reply({
                embeds: [EmbedManager.createSuccessEmbed(
                    'Ticket créé',
                    `Votre ticket a été créé : ${ticketChannel}`
                )],
                ephemeral: true
            });

            // Log dans le canal de logs
            await this.logTicketAction('create', {
                user: interaction.user,
                channel: ticketChannel,
                reason,
                ticketId
            });

        } catch (error) {
            console.error('❌ Erreur lors de la création du ticket:', error);
            await interaction.reply({
                embeds: [EmbedManager.createErrorEmbed(
                    'Erreur',
                    'Une erreur est survenue lors de la création du ticket.'
                )],
                ephemeral: true
            });
        }
    }

    async closeTicket(interaction, ticketId, reason = 'Non spécifiée') {
        try {
            const channel = interaction.channel;
            const ticketData = this.activeTickets.get(channel.id);

            if (!ticketData) {
                const errorEmbed = EmbedManager.createErrorEmbed(
                    'Erreur',
                    'Ce salon n\'est pas un ticket actif.'
                );
                
                if (!interaction.replied && !interaction.deferred) {
                    return await interaction.reply({
                        embeds: [errorEmbed],
                        ephemeral: true
                    });
                } else {
                    return await interaction.editReply({
                        embeds: [errorEmbed]
                    });
                }
            }

            // Générer un ID unique pour l'archive
            const archiveId = `${ticketData.ticketId}-${Date.now()}`;

            // Collecter les messages du ticket
            const messages = [];
            try {
                const messageCollection = await channel.messages.fetch({ limit: 100 });
                
                messageCollection.reverse().forEach(msg => {
                    if (msg.content) {
                        messages.push({
                            author: msg.author.bot ? `[BOT] ${msg.author.username}` : msg.author.username,
                            content: msg.content,
                            timestamp: msg.createdAt.toISOString()
                        });
                    }
                });
            } catch (msgError) {
                console.warn('Erreur lors de la collecte des messages:', msgError);
            }

            // Archiver le ticket
            this.archivedTickets.set(archiveId, {
                ...ticketData,
                archivedBy: interaction.user.id,
                archivedAt: new Date().toISOString(),
                closeReason: reason,
                messages
            });

            this.saveArchivedTickets();

            // Log de l'archivage
            await this.logTicketAction('close', {
                user: interaction.user,
                channel,
                reason,
                ticketId: archiveId,
                owner: ticketData.owner
            });

            const closeEmbed = EmbedManager.createInfoEmbed(
                'Ticket fermé',
                `Ce ticket va être supprimé dans 5 secondes...\n**Raison:** ${reason}\n**ID Archive:** ${archiveId}`
            );

            // Message de fermeture avec gestion d'erreur
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        embeds: [closeEmbed]
                    });
                } else {
                    await interaction.editReply({
                        embeds: [closeEmbed],
                        components: []
                    });
                }
            } catch (replyError) {
                console.warn('Erreur lors de la réponse d\'interaction:', replyError);
                // Envoyer directement dans le canal si l'interaction échoue
                await channel.send({
                    embeds: [closeEmbed]
                });
            }

            // Attendre 5 secondes puis supprimer
            setTimeout(async () => {
                try {
                    this.activeTickets.delete(channel.id);
                    this.saveConfig();
                    await channel.delete();
                } catch (deleteError) {
                    console.error('Erreur lors de la suppression du canal:', deleteError);
                }
            }, 5000);

        } catch (error) {
            console.error('❌ Erreur lors de la fermeture du ticket:', error);
            const errorEmbed = EmbedManager.createErrorEmbed(
                'Erreur',
                'Une erreur est survenue lors de la fermeture du ticket.'
            );
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        embeds: [errorEmbed],
                        ephemeral: true
                    });
                } else {
                    await interaction.editReply({
                        embeds: [errorEmbed],
                        components: []
                    });
                }
            } catch (replyError) {
                console.error('Erreur lors de la réponse d\'erreur:', replyError);
            }
        }
    }

    async quickCloseTicket(interaction, ticketId) {
        try {
            // Fermeture rapide sans demander de raison
            await this.closeTicket(interaction, ticketId, 'Fermeture rapide');
        } catch (error) {
            console.error('❌ Erreur lors de la fermeture rapide du ticket:', error);
        }
    }

    async logTicketAction(action, data) {
        try {
            if (!this.config.logChannelId) return;

            const logChannel = this.client.channels.cache.get(this.config.logChannelId);
            if (!logChannel) return;

            let embed;
            let content = '';

            switch (action) {
                case 'create':
                    embed = EmbedManager.createEmbed({
                        title: `🎫 Ticket Créé: ${data.channel.name}`,
                        description: `Un nouveau ticket a été créé par ${data.user}`,
                        fields: [
                            {
                                name: 'ID du ticket',
                                value: data.ticketId,
                                inline: true
                            },
                            {
                                name: 'Raison',
                                value: data.reason,
                                inline: true
                            },
                            {
                                name: 'Canal',
                                value: data.channel.toString(),
                                inline: true
                            }
                        ],
                        footer: {
                            text: `Créé par: ${data.user.username} (ID: ${data.user.id})`
                        },
                        timestamp: new Date(),
                        color: EmbedManager.getDefaultColor()
                    });
                    content = `📢 **Nouveau ticket** • ID: \`${data.ticketId}\``;
                    break;

                case 'close':
                    embed = EmbedManager.createEmbed({
                        title: `🔒 Ticket Fermé: ${data.channel.name}`,
                        description: `Un ticket a été fermé par ${data.user}`,
                        fields: [
                            {
                                name: 'ID du ticket',
                                value: data.ticketId,
                                inline: true
                            },
                            {
                                name: 'Raison de fermeture',
                                value: data.reason,
                                inline: true
                            },
                            {
                                name: 'Créé par',
                                value: `<@${data.owner}>`,
                                inline: true
                            }
                        ],
                        footer: {
                            text: `Fermé par: ${data.user.username} (ID: ${data.user.id})`
                        },
                        timestamp: new Date(),
                        color: EmbedManager.getLogsColor()
                    });
                    content = `📢 **Ticket fermé** • ID: \`${data.ticketId}\``;
                    break;
            }

            if (embed) {
                await logChannel.send({
                    content,
                    embeds: [embed]
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors du log de l\'action:', error);
        }
    }

    async refreshTicketMessage() {
        try {
            if (!this.config.createChannelId) {
                console.warn('⚠️ Canal de tickets non configuré');
                return false;
            }

            const channel = this.client.channels.cache.get(this.config.createChannelId);
            if (!channel) {
                console.warn(`⚠️ Canal de tickets introuvable (ID: ${this.config.createChannelId})`);
                return false;
            }

            // Purger les anciens messages
            try {
                const messages = await channel.messages.fetch({ limit: 5 });
                if (messages.size > 0) {
                    await channel.bulkDelete(messages);
                }
            } catch (error) {
                console.warn('Impossible de purger les messages, on continue...');
            }

            // Créer le nouveau message avec un menu unique
            const embed = this.createTicketEmbed();
            const selectMenu = this.createTicketSelectMenu();
            const row = new ActionRowBuilder().addComponents(selectMenu);

            const ticketMessage = await channel.send({
                embeds: [embed],
                components: [row]
            });

            // Mettre à jour la configuration
            this.config.ticketMessageId = ticketMessage.id;
            this.saveConfig();

            console.log(`✅ Message des tickets rafraîchi (ID: ${ticketMessage.id})`);
            return true;

        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement du message des tickets:', error);
            return false;
        }
    }
}

module.exports = TicketSystem;
