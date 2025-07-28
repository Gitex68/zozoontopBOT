const { Collection, MessageFlags, ActionRowBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Gérer les commandes slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            console.log(`${interaction.user.username} a effectué la commande ${interaction.commandName}`);

            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1000);
                    return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
        }
        
        // Gérer les boutons du système de salons vocaux
        else if (interaction.isButton() && interaction.customId.startsWith('voice_')) {
            const voiceSystem = interaction.client.voiceSystem;
            if (voiceSystem) {
                // Gérer la confirmation de suppression
                if (interaction.customId.startsWith('voice_confirm_delete_')) {
                    const channelId = interaction.customId.replace('voice_confirm_delete_', '');
                    const channel = interaction.guild.channels.cache.get(channelId);
                    
                    if (channel && voiceSystem.tempChannels.has(channelId)) {
                        const channelData = voiceSystem.tempChannels.get(channelId);
                        
                        // Vérifier que l'utilisateur est le propriétaire
                        if (interaction.user.id === channelData.owner) {
                            // Supprimer le salon
                            voiceSystem.tempChannels.delete(channelId);
                            voiceSystem.saveConfig();
                            
                            await interaction.reply({
                                content: '✅ Le salon va être supprimé dans quelques secondes...',
                                ephemeral: true
                            });
                            
                            await channel.delete('Suppression demandée par le propriétaire');
                        } else {
                            await interaction.reply({
                                content: '❌ Seul le propriétaire peut supprimer ce salon.',
                                ephemeral: true
                            });
                        }
                    } else {
                        await interaction.reply({
                            content: '❌ Salon introuvable ou non géré.',
                            ephemeral: true
                        });
                    }
                }
                // Gérer l'annulation de suppression
                else if (interaction.customId.startsWith('voice_cancel_delete_')) {
                    await interaction.reply({
                        content: '❌ Suppression annulée.',
                        ephemeral: true
                    });
                }
                // Autres boutons du système vocal
                else {
                    await voiceSystem.handleButtonInteraction(interaction);
                }
            }
        }
        
        // Gérer les menus déroulants du système de tickets
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith('ticket_reason_select')) {
                const ticketSystem = interaction.client.ticketSystem;
                
                // Vérifier si c'est l'option "choisir"
                if (interaction.values[0] === 'no_action') {
                    // Utiliser update au lieu de deferUpdate pour réinitialiser immédiatement
                    const selectMenu = ticketSystem.createTicketSelectMenu();
                    const row = new ActionRowBuilder().addComponents(selectMenu);
                    
                    await interaction.update({
                        embeds: [ticketSystem.createTicketEmbed()],
                        components: [row]
                    });
                    return;
                }

                // Trouver la raison correspondante
                const reasons = ticketSystem.ticketReasons.length > 0 ? ticketSystem.ticketReasons : [
                    { label: 'Assistance générale', emoji: '❓', description: 'Demande d\'aide générale' },
                    { label: 'Signalement', emoji: '🚨', description: 'Signaler un problème' },
                    { label: 'Suggestion', emoji: '💡', description: 'Proposer une idée ou suggestion' },
                    { label: 'Autre', emoji: '📝', description: 'Autre demande' }
                ];

                const selectedReason = reasons.find(reason => 
                    reason.label.toLowerCase().replace(/\s+/g, '_') === interaction.values[0]
                );

                const reason = selectedReason ? selectedReason.label : 'Demande générale';

                try {
                    await ticketSystem.createTicket(interaction, reason);
                    
                    // Réinitialiser le menu immédiatement après création réussie
                    setTimeout(async () => {
                        try {
                            const channel = ticketSystem.client.channels.cache.get(ticketSystem.config.createChannelId);
                            if (channel && ticketSystem.config.ticketMessageId) {
                                const message = await channel.messages.fetch(ticketSystem.config.ticketMessageId);
                                const selectMenu = ticketSystem.createTicketSelectMenu();
                                const row = new ActionRowBuilder().addComponents(selectMenu);
                                
                                await message.edit({
                                    embeds: [ticketSystem.createTicketEmbed()],
                                    components: [row]
                                });
                            }
                        } catch (error) {
                            console.error('Erreur lors de la réinitialisation du menu:', error);
                        }
                    }, 500);
                    
                } catch (error) {
                    console.error('Erreur lors de la création du ticket:', error);
                    
                    // En cas d'erreur, réinitialiser quand même le menu
                    try {
                        const selectMenu = ticketSystem.createTicketSelectMenu();
                        const row = new ActionRowBuilder().addComponents(selectMenu);
                        
                        if (!interaction.replied) {
                            await interaction.update({
                                embeds: [ticketSystem.createTicketEmbed()],
                                components: [row]
                            });
                        }
                    } catch (updateError) {
                        console.error('Erreur lors de la mise à jour du menu:', updateError);
                    }
                }
            }
        }
        
        // Gérer les modals
        else if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('voice_rename_modal_')) {
                const voiceSystem = interaction.client.voiceSystem;
                if (voiceSystem) {
                    await voiceSystem.handleRenameModal(interaction);
                }
            } else if (interaction.customId.startsWith('voice_limit_modal_')) {
                const voiceSystem = interaction.client.voiceSystem;
                if (voiceSystem) {
                    await voiceSystem.handleLimitModal(interaction);
                }
            } else if (interaction.customId.startsWith('voice_transfer_modal_')) {
                const voiceSystem = interaction.client.voiceSystem;
                if (voiceSystem) {
                    await voiceSystem.handleTransferModal(interaction);
                }
            } else if (interaction.customId.startsWith('reason_modal_')) {
                const ticketSystem = interaction.client.ticketSystem;
                const ticketId = interaction.customId.replace('reason_modal_', '');
                const reason = interaction.fields.getTextInputValue('close_reason');
                
                await ticketSystem.closeTicket(interaction, ticketId, reason);
            }
        }
        
        // Gérer les boutons du système de tickets
        else if (interaction.isButton()) {
            const ticketSystem = interaction.client.ticketSystem;
            
            if (interaction.customId.startsWith('close_ticket_quick_')) {
                const ticketId = interaction.customId.replace('close_ticket_quick_', '');
                
                // Vérifier les permissions
                const ticketData = ticketSystem.activeTickets.get(interaction.channel.id);
                if (!ticketData) {
                    return await interaction.reply({
                        content: '❌ Ce salon n\'est pas un ticket actif.',
                        ephemeral: true
                    });
                }

                const isOwner = ticketData.owner === interaction.user.id;
                const isAdmin = interaction.member.permissions.has('Administrator');

                if (!isOwner && !isAdmin) {
                    return await interaction.reply({
                        content: '❌ Seul le créateur du ticket ou un administrateur peut fermer ce ticket.',
                        ephemeral: true
                    });
                }

                // Fermeture rapide directe
                await ticketSystem.quickCloseTicket(interaction, ticketId);
            }
            
            else if (interaction.customId.startsWith('close_ticket_')) {
                const ticketId = interaction.customId.replace('close_ticket_', '');
                
                // Vérifier les permissions
                const ticketData = ticketSystem.activeTickets.get(interaction.channel.id);
                if (!ticketData) {
                    return await interaction.reply({
                        content: '❌ Ce salon n\'est pas un ticket actif.',
                        ephemeral: true
                    });
                }

                const isOwner = ticketData.owner === interaction.user.id;
                const isAdmin = interaction.member.permissions.has('Administrator');

                if (!isOwner && !isAdmin) {
                    return await interaction.reply({
                        content: '❌ Seul le créateur du ticket ou un administrateur peut fermer ce ticket.',
                        ephemeral: true
                    });
                }

                // Créer des boutons de confirmation simples
                const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
                
                const confirmButton = new ButtonBuilder()
                    .setCustomId(`confirm_close_${ticketId}`)
                    .setLabel('Confirmer la fermeture')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('✅');
                
                const cancelButton = new ButtonBuilder()
                    .setCustomId(`cancel_close_${ticketId}`)
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❌');

                const reasonButton = new ButtonBuilder()
                    .setCustomId(`close_with_reason_${ticketId}`)
                    .setLabel('Fermer avec raison')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝');

                const row = new ActionRowBuilder().addComponents(confirmButton, reasonButton, cancelButton);

                await interaction.reply({
                    embeds: [ticketSystem.client.ticketSystem.createWarningEmbed || (() => {
                        const EmbedManager = require('../utils/embedManager');
                        return EmbedManager.createWarningEmbed(
                            'Confirmer la fermeture',
                            'Êtes-vous sûr de vouloir fermer ce ticket?'
                        );
                    })()],
                    components: [row],
                    ephemeral: true
                });
            }
            
            else if (interaction.customId.startsWith('confirm_close_')) {
                const ticketId = interaction.customId.replace('confirm_close_', '');
                await ticketSystem.closeTicket(interaction, ticketId, 'Fermeture confirmée');
            }
            
            else if (interaction.customId.startsWith('cancel_close_')) {
                try {
                    await interaction.update({
                        embeds: [(() => {
                            const EmbedManager = require('../utils/embedManager');
                            return EmbedManager.createInfoEmbed(
                                'Fermeture annulée',
                                'La fermeture du ticket a été annulée.'
                            );
                        })()],
                        components: []
                    });
                } catch (error) {
                    console.error('Erreur lors de l\'annulation:', error);
                    if (!interaction.replied) {
                        await interaction.reply({
                            embeds: [(() => {
                                const EmbedManager = require('../utils/embedManager');
                                return EmbedManager.createInfoEmbed(
                                    'Fermeture annulée',
                                    'La fermeture du ticket a été annulée.'
                                );
                            })()],
                            ephemeral: true
                        });
                    }
                }
            }
            
            else if (interaction.customId.startsWith('close_with_reason_')) {
                const ticketId = interaction.customId.replace('close_with_reason_', '');
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                
                const modal = new ModalBuilder()
                    .setCustomId(`reason_modal_${ticketId}`)
                    .setTitle('Raison de fermeture');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('close_reason')
                    .setLabel('Raison de la fermeture')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Décrivez brièvement la raison de la fermeture...')
                    .setRequired(true)
                    .setMaxLength(500);

                const row = new ActionRowBuilder().addComponents(reasonInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }
            
            else if (interaction.customId.startsWith('add_user_')) {
                await interaction.reply({
                    content: '➕ **Ajouter un utilisateur**\n\nVeuillez utiliser la commande `/ticketadd @utilisateur` pour ajouter un utilisateur à ce ticket.',
                    ephemeral: true
                });
            }
            
            else if (interaction.customId.startsWith('quick_close_cmd_')) {
                const ticketId = interaction.customId.replace('quick_close_cmd_', '');
                await ticketSystem.closeTicket(interaction, ticketId, 'Fermeture rapide via commande');
            }
            
            else if (interaction.customId.startsWith('with_reason_cmd_')) {
                const ticketId = interaction.customId.replace('with_reason_cmd_', '');
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                
                const modal = new ModalBuilder()
                    .setCustomId(`cmd_reason_modal_${ticketId}`)
                    .setTitle('Raison de fermeture');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('close_reason')
                    .setLabel('Raison de la fermeture')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Décrivez brièvement la raison de la fermeture...')
                    .setRequired(true)
                    .setMaxLength(500);

                const row = new ActionRowBuilder().addComponents(reasonInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }
            
            else if (interaction.customId === 'cancel_cmd') {
                try {
                    await interaction.update({
                        embeds: [(() => {
                            const EmbedManager = require('../utils/embedManager');
                            return EmbedManager.createInfoEmbed(
                                'Fermeture annulée',
                                'L\'opération de fermeture a été annulée.'
                            );
                        })()],
                        components: []
                    });
                } catch (error) {
                    console.error('Erreur lors de l\'annulation:', error);
                    if (!interaction.replied) {
                        await interaction.reply({
                            embeds: [(() => {
                                const EmbedManager = require('../utils/embedManager');
                                return EmbedManager.createInfoEmbed(
                                    'Fermeture annulée',
                                    'L\'opération de fermeture a été annulée.'
                                );
                            })()],
                            ephemeral: true
                        });
                    }
                }
            }
        }
        
        // Gérer les modals
        else if (interaction.isModalSubmit()) {
            const ticketSystem = interaction.client.ticketSystem;
            
            if (interaction.customId.startsWith('reason_modal_') || interaction.customId.startsWith('cmd_reason_modal_')) {
                const ticketId = interaction.customId.replace('reason_modal_', '').replace('cmd_reason_modal_', '');
                const reason = interaction.fields.getTextInputValue('close_reason');
                
                await ticketSystem.closeTicket(interaction, ticketId, reason);
            }
        }
    }
};
