const { 
    ChannelType,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const EmbedManager = require('./embedManager');

class VoiceSystem {
    constructor(client) {
        this.client = client;
        this.tempChannels = new Map(); // {channel_id: {owner: user_id, configMessage: message_id, locked: boolean}}
        this.configFile = path.join(__dirname, '../data/voice_config.json');
        this.config = {
            categoryId: null,
            createChannelId: null
        };
        
        this.loadConfig();
        this.setupEventListeners();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.config = { ...this.config, ...data };
                this.tempChannels = new Map(Object.entries(data.tempChannels || {}));
                console.log('✅ Configuration des salons vocaux chargée');
            } else {
                console.log('⚠️ Aucune configuration de salons vocaux trouvée');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la configuration des salons vocaux:', error);
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
                tempChannels: Object.fromEntries(this.tempChannels)
            };

            fs.writeFileSync(this.configFile, JSON.stringify(configData, null, 4));
            console.log('✅ Configuration des salons vocaux sauvegardée');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde de la configuration des salons vocaux:', error);
        }
    }

    createConfigEmbed(member, channel) {
        return EmbedManager.createEmbed({
            title: '🎮 Panneau de Configuration',
            description: `Bienvenue dans votre salon privé, ${member}!\nUtilisez les boutons ci-dessous pour personnaliser votre salon.`,
            fields: [
                {
                    name: '🛠️ Contrôles',
                    value: '🔒 • Verrouiller/Déverrouiller le salon\n✏️ • Modifier le nom\n👥 • Définir une limite de membres\n👑 • Transférer la propriété\n🗑️ • Supprimer le salon',
                    inline: false
                }
            ],
            footer: {
                text: '⭐ Tip: Seul le propriétaire peut utiliser ces contrôles'
            },
            thumbnail: member.guild.iconURL()
        });
    }

    createControlButtons(channelId) {
        return [
            new ButtonBuilder()
                .setCustomId(`voice_lock_${channelId}`)
                .setLabel('Verrouiller/Déverrouiller')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔒'),
            
            new ButtonBuilder()
                .setCustomId(`voice_rename_${channelId}`)
                .setLabel('Renommer')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('✏️'),
            
            new ButtonBuilder()
                .setCustomId(`voice_limit_${channelId}`)
                .setLabel('Limite de membres')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👥'),
            
            new ButtonBuilder()
                .setCustomId(`voice_transfer_${channelId}`)
                .setLabel('Transférer')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👑'),
            
            new ButtonBuilder()
                .setCustomId(`voice_delete_${channelId}`)
                .setLabel('Supprimer')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️')
        ];
    }

    setupEventListeners() {
        // Note: Les événements sont gérés automatiquement par Discord.js
        // Nous n'avons besoin de rien configurer ici
        console.log('🎧 Écouteurs d\'événements vocaux configurés');
    }

    async setupVoiceSystem(guild) {
        try {
            // Vérifier si la catégorie existe déjà
            let category = guild.channels.cache.find(c => c.name === "Salons privés" && c.type === ChannelType.GuildCategory);
            
            if (!category) {
                // Créer la catégorie avec des permissions par défaut
                const overwrites = [
                    {
                        id: guild.id, // @everyone
                        allow: [PermissionFlagsBits.ViewChannel]
                    }
                ];
                
                category = await guild.channels.create({
                    name: "Salons privés",
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: overwrites
                });
                console.log("✅ Catégorie 'Salons privés' créée");
            }

            // Vérifier si le salon de création existe déjà
            let createChannel = category.children.cache.find(c => c.name === "➕ Créer votre salon");
            
            if (!createChannel) {
                // Créer le salon avec des permissions spécifiques
                const overwrites = [
                    {
                        id: guild.id, // @everyone
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.Connect
                        ],
                        deny: [PermissionFlagsBits.Speak]
                    }
                ];
                
                createChannel = await category.children.create({
                    name: "➕ Créer votre salon",
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: overwrites
                });
                console.log("✅ Salon de création créé");
            }

            // Sauvegarder la configuration
            this.config.categoryId = category.id;
            this.config.createChannelId = createChannel.id;
            this.saveConfig();

            return {
                success: true,
                category: category,
                createChannel: createChannel
            };

        } catch (error) {
            console.error('❌ Erreur lors de la configuration des salons vocaux:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleVoiceStateUpdate(oldState, newState) {
        try {
            const member = newState.member || oldState.member;
            if (!member || member.user.bot) return;

            // Création d'un salon privé
            if (newState.channel && newState.channel.id === this.config.createChannelId) {
                await this.createPrivateChannel(member, newState.channel);
            }

            // Suppression d'un salon privé vide
            if (oldState.channel && this.tempChannels.has(oldState.channel.id)) {
                // Attendre un peu pour s'assurer que l'état du salon est à jour
                setTimeout(async () => {
                    await this.checkAndDeleteEmptyChannel(oldState.channel);
                }, 500);
            }

        } catch (error) {
            console.error('❌ Erreur lors de la gestion des salons vocaux:', error);
        }
    }

    async createPrivateChannel(member, createChannel) {
        try {
            const category = createChannel.parent;
            if (!category) {
                console.error('❌ Catégorie introuvable pour les salons privés');
                return;
            }

            const channelName = `🎧 Salon de ${member.displayName}`;

            // Configuration des permissions
            const overwrites = [
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ManageRoles,
                        PermissionFlagsBits.MoveMembers,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: member.guild.id, // @everyone
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },
                {
                    id: this.client.user.id, // Bot
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ManageRoles,
                        PermissionFlagsBits.SendMessages
                    ]
                }
            ];

            // Créer le salon vocal
            const newChannel = await category.children.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                permissionOverwrites: overwrites
            });

            // Déplacer l'utilisateur
            await member.voice.setChannel(newChannel);

            // Envoyer le message de configuration avec boutons
            const embed = this.createConfigEmbed(member, newChannel);
            const buttons = this.createControlButtons(newChannel.id);
            const row1 = new ActionRowBuilder().addComponents(buttons.slice(0, 3));
            const row2 = new ActionRowBuilder().addComponents(buttons.slice(3, 5));
            
            const configMessage = await newChannel.send({ 
                embeds: [embed], 
                components: [row1, row2] 
            });

            // Enregistrer le salon temporaire
            this.tempChannels.set(newChannel.id, {
                owner: member.id,
                configMessage: configMessage.id,
                locked: false
            });

            this.saveConfig();
            console.log(`✅ Salon privé créé pour ${member.displayName}`);

        } catch (error) {
            console.error('❌ Erreur lors de la création du salon privé:', error);
        }
    }

    async checkAndDeleteEmptyChannel(channel) {
        try {
            if (!channel || !this.tempChannels.has(channel.id)) return;

            // Vérifier si le salon existe toujours et s'il est vide
            const currentChannel = this.client.channels.cache.get(channel.id);
            if (currentChannel && currentChannel.members.size === 0) {
                console.log(`🗑️ Suppression du salon privé '${currentChannel.name}' (vide)`);
                
                // Supprimer de la mémoire avant de supprimer de Discord
                this.tempChannels.delete(channel.id);
                this.saveConfig();
                
                // Supprimer le salon
                await currentChannel.delete('Salon privé vide');
                console.log('✅ Salon privé supprimé avec succès');
            }

        } catch (error) {
            if (error.code === 10003) { // Canal non trouvé
                // Le salon a déjà été supprimé, nettoyer les données
                this.tempChannels.delete(channel.id);
                this.saveConfig();
                console.log('ℹ️ Le salon avait déjà été supprimé');
            } else {
                console.error('❌ Erreur lors de la suppression du salon:', error);
            }
        }
    }

    async toggleChannelLock(channel, member, channelData) {
        try {
            const isLocked = channelData.locked || false;
            
            if (!isLocked) {
                // Verrouiller le salon
                await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                    Connect: false
                });
                
                this.tempChannels.set(channel.id, { ...channelData, locked: true });
                this.saveConfig();
                
                const embed = EmbedManager.createEmbed({
                    title: '🔒 Salon verrouillé',
                    description: 'L\'accès au salon est maintenant restreint.',
                    color: '#dc3545',
                    footer: {
                        text: `Action exécutée par ${member.displayName}`,
                        iconURL: member.user.displayAvatarURL()
                    }
                });
                
                await channel.send({ embeds: [embed] });
            } else {
                // Déverrouiller le salon
                await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                    Connect: true
                });
                
                this.tempChannels.set(channel.id, { ...channelData, locked: false });
                this.saveConfig();
                
                const embed = EmbedManager.createEmbed({
                    title: '🔓 Salon déverrouillé',
                    description: 'L\'accès au salon est maintenant ouvert à tous.',
                    color: '#28a745',
                    footer: {
                        text: `Action exécutée par ${member.displayName}`,
                        iconURL: member.user.displayAvatarURL()
                    }
                });
                
                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('❌ Erreur lors du verrouillage/déverrouillage:', error);
        }
    }

    async handleButtonInteraction(interaction) {
        try {
            const channel = interaction.channel;
            const channelId = interaction.customId.split('_')[2]; // Extraire l'ID du canal
            
            if (!this.tempChannels.has(channelId)) {
                return await interaction.reply({
                    content: '❌ Ce salon n\'est pas géré par le système.',
                    ephemeral: true
                });
            }

            const channelData = this.tempChannels.get(channelId);
            if (interaction.user.id !== channelData.owner) {
                return await interaction.reply({
                    content: '❌ Seul le propriétaire peut utiliser ces contrôles.',
                    ephemeral: true
                });
            }

            const member = channel.guild.members.cache.get(interaction.user.id);
            if (!member) return;

            if (interaction.customId.startsWith('voice_lock_')) {
                await this.toggleChannelLock(channel, member, channelData);
                await interaction.reply({
                    content: channelData.locked ? '🔓 Salon déverrouillé' : '🔒 Salon verrouillé',
                    ephemeral: true
                });
            } else if (interaction.customId.startsWith('voice_rename_')) {
                await this.showRenameModal(interaction, channelId);
            } else if (interaction.customId.startsWith('voice_limit_')) {
                await this.showLimitModal(interaction, channelId);
            } else if (interaction.customId.startsWith('voice_transfer_')) {
                await this.showTransferModal(interaction, channelId);
            } else if (interaction.customId.startsWith('voice_delete_')) {
                await this.showDeleteConfirmation(interaction, channelId);
            }

        } catch (error) {
            console.error('❌ Erreur lors de la gestion du bouton vocal:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue.',
                    ephemeral: true
                });
            }
        }
    }

    async showRenameModal(interaction, channelId) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`voice_rename_modal_${channelId}`)
            .setTitle('Renommer le salon');

        const nameInput = new TextInputBuilder()
            .setCustomId('new_name')
            .setLabel('Nouveau nom du salon')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Entrez le nouveau nom...')
            .setRequired(true)
            .setMaxLength(50);

        const row = new ActionRowBuilder().addComponents(nameInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    async showLimitModal(interaction, channelId) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`voice_limit_modal_${channelId}`)
            .setTitle('Limite de membres');

        const limitInput = new TextInputBuilder()
            .setCustomId('user_limit')
            .setLabel('Nombre maximum de membres (0-99)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('0 pour illimité')
            .setRequired(true)
            .setMaxLength(2);

        const row = new ActionRowBuilder().addComponents(limitInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    async showTransferModal(interaction, channelId) {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        
        const modal = new ModalBuilder()
            .setCustomId(`voice_transfer_modal_${channelId}`)
            .setTitle('Transférer la propriété');

        const userInput = new TextInputBuilder()
            .setCustomId('new_owner')
            .setLabel('ID ou nom d\'utilisateur du nouveau propriétaire')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('@utilisateur ou ID utilisateur')
            .setRequired(true)
            .setMaxLength(50);

        const row = new ActionRowBuilder().addComponents(userInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    async showDeleteConfirmation(interaction, channelId) {
        const confirmButton = new ButtonBuilder()
            .setCustomId(`voice_confirm_delete_${channelId}`)
            .setLabel('Confirmer la suppression')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('✅');

        const cancelButton = new ButtonBuilder()
            .setCustomId(`voice_cancel_delete_${channelId}`)
            .setLabel('Annuler')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const embed = EmbedManager.createEmbed({
            title: '⚠️ Confirmation de suppression',
            description: 'Êtes-vous sûr de vouloir supprimer ce salon ?\nCette action est irréversible.',
            color: '#ffc107'
        });

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }

    async handleRenameModal(interaction) {
        try {
            const channelId = interaction.customId.split('_')[3];
            const newName = interaction.fields.getTextInputValue('new_name');
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel || !this.tempChannels.has(channelId)) {
                return await interaction.reply({
                    content: '❌ Salon introuvable.',
                    ephemeral: true
                });
            }

            await channel.setName(`🎧 ${newName}`);

            await interaction.reply({
                content: `✅ Le salon a été renommé en : **${newName}**`,
                ephemeral: true
            });

        } catch (error) {
            console.error('❌ Erreur lors du renommage:', error);
            await interaction.reply({
                content: '❌ Erreur lors du renommage du salon.',
                ephemeral: true
            });
        }
    }

    async handleLimitModal(interaction) {
        try {
            const channelId = interaction.customId.split('_')[3];
            const limitStr = interaction.fields.getTextInputValue('user_limit');
            const limit = parseInt(limitStr);
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel || !this.tempChannels.has(channelId)) {
                return await interaction.reply({
                    content: '❌ Salon introuvable.',
                    ephemeral: true
                });
            }

            if (isNaN(limit) || limit < 0 || limit > 99) {
                return await interaction.reply({
                    content: '❌ Veuillez entrer un nombre entre 0 et 99.',
                    ephemeral: true
                });
            }

            await channel.setUserLimit(limit);

            await interaction.reply({
                content: `✅ Limite définie à **${limit}** membres.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('❌ Erreur lors de la définition de la limite:', error);
            await interaction.reply({
                content: '❌ Erreur lors de la définition de la limite.',
                ephemeral: true
            });
        }
    }

    async handleTransferModal(interaction) {
        try {
            const channelId = interaction.customId.split('_')[3];
            const newOwnerInput = interaction.fields.getTextInputValue('new_owner');
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel || !this.tempChannels.has(channelId)) {
                return await interaction.reply({
                    content: '❌ Salon introuvable.',
                    ephemeral: true
                });
            }

            // Rechercher le nouvel utilisateur
            let newOwner;
            if (newOwnerInput.startsWith('<@') && newOwnerInput.endsWith('>')) {
                // Format mention
                const userId = newOwnerInput.slice(2, -1).replace('!', '');
                newOwner = channel.guild.members.cache.get(userId);
            } else if (/^\d+$/.test(newOwnerInput)) {
                // Format ID
                newOwner = channel.guild.members.cache.get(newOwnerInput);
            } else {
                // Format nom d'utilisateur
                newOwner = channel.guild.members.cache.find(m => 
                    m.user.username.toLowerCase() === newOwnerInput.toLowerCase() ||
                    m.displayName.toLowerCase() === newOwnerInput.toLowerCase()
                );
            }

            if (!newOwner) {
                return await interaction.reply({
                    content: '❌ Utilisateur introuvable.',
                    ephemeral: true
                });
            }

            if (!channel.members.has(newOwner.id)) {
                return await interaction.reply({
                    content: '❌ Cette personne n\'est pas dans le salon.',
                    ephemeral: true
                });
            }

            // Transférer les permissions
            await channel.permissionOverwrites.edit(newOwner, {
                ViewChannel: true,
                Connect: true,
                Speak: true,
                ManageChannels: true,
                ManageRoles: true,
                MoveMembers: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            await channel.permissionOverwrites.delete(interaction.member);

            // Mettre à jour les données
            const channelData = this.tempChannels.get(channelId);
            channelData.owner = newOwner.id;
            this.tempChannels.set(channelId, channelData);
            this.saveConfig();

            await interaction.reply({
                content: `✅ **${newOwner.displayName}** est maintenant le propriétaire du salon.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('❌ Erreur lors du transfert:', error);
            await interaction.reply({
                content: '❌ Erreur lors du transfert de propriété.',
                ephemeral: true
            });
        }
    }
}

module.exports = VoiceSystem;
