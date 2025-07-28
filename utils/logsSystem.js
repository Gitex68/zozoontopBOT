const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const EmbedManager = require('./embedManager');

class LogsSystem {
    constructor(client) {
        this.client = client;
        this.configFile = path.join(__dirname, '../data/logs_config.json');
        this.config = {
            logsChannelId: null,
            guildId: null,
            enabledEvents: { moderation: true, members: true, channels: true, messages: true, roles: true, server: true, invites: true, forums: true }
        };
        this.logHistory = [];
        this.loadConfig();
        console.log('🎧 Écouteurs d\'événements logs configurés');
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                this.config = { ...this.config, ...JSON.parse(fs.readFileSync(this.configFile, 'utf8')) };
                console.log('✅ Configuration des logs chargée');
            } else {
                console.log('⚠️ Aucune configuration de logs trouvée');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la configuration des logs:', error);
        }
    }

    saveConfig() {
        try {
            const dir = path.dirname(this.configFile);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 4));
            console.log('✅ Configuration des logs sauvegardée');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde de la configuration des logs:', error);
        }
    }

    async sendLog(embed) {
        if (!this.config.logsChannelId) return;
        try {
            const channel = await this.client.channels.fetch(this.config.logsChannelId);
            if (channel) {
                await channel.send({ embeds: [embed] });
                // Stocker dans l'historique pour l'export
                this.logHistory.push({
                    timestamp: new Date(),
                    title: embed.data.title,
                    description: embed.data.description,
                    fields: embed.data.fields || [],
                    color: embed.data.color
                });
                // Limiter l'historique à 1000 entrées
                if (this.logHistory.length > 1000) {
                    this.logHistory = this.logHistory.slice(-1000);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du log:', error);
        }
    }

    createLogEmbed(title, description, fields, color, user) {
        const embed = EmbedManager.createEmbed({ title, description, fields, color, timestamp: new Date() });
        if (user) embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
        return embed;
    }

    // === MODÉRATION ===
    async logBan(guild, user, executor, reason) {
        if (!this.config.enabledEvents.moderation) return;
        const embed = this.createLogEmbed('🔨 Bannissement', `**${user.tag}** a été banni(e)`, [
            { name: '👤 Utilisateur', value: `${user.tag}\n\`${user.id}\``, inline: true },
            { name: '👮 Modérateur', value: executor ? `${executor.tag}\n\`${executor.id}\`` : 'Inconnu', inline: true },
            { name: '📋 Raison', value: reason || 'Aucune raison spécifiée', inline: false }
        ], '#dc3545', user);
        await this.sendLog(embed);
    }

    async logUnban(guild, user, executor) {
        if (!this.config.enabledEvents.moderation) return;
        const embed = this.createLogEmbed('✅ Débannissement', `**${user.tag}** a été débanni(e)`, [
            { name: '👤 Utilisateur', value: `${user.tag}\n\`${user.id}\``, inline: true },
            { name: '👮 Modérateur', value: executor ? `${executor.tag}\n\`${executor.id}\`` : 'Inconnu', inline: true }
        ], '#28a745', user);
        await this.sendLog(embed);
    }

    async logMemberKick(member, executor, reason) {
        if (!this.config.enabledEvents.moderation) return;
        const embed = this.createLogEmbed('👢 Membre expulsé', `**${member.user.tag}** a été expulsé(e)`, [
            { name: '👤 Utilisateur', value: `${member.user.tag}\n\`${member.user.id}\``, inline: true },
            { name: '👮 Modérateur', value: executor ? `${executor.tag}\n\`${executor.id}\`` : 'Inconnu', inline: true },
            { name: '📋 Raison', value: reason || 'Aucune raison spécifiée', inline: false }
        ], '#ff6b35', member.user);
        await this.sendLog(embed);
    }

    // === MESSAGES ===
    async logMessageDelete(message, executor) {
        if (!this.config.enabledEvents.messages || message.author.bot) return;
        const fields = [
            { name: '👤 Auteur', value: `${message.author.tag}\n\`${message.author.id}\``, inline: true },
            { name: '📍 Salon', value: `${message.channel}\n\`${message.channel.id}\``, inline: true },
            { name: '🗑️ Supprimé par', value: executor ? `${executor.tag}\n\`${executor.id}\`` : 'Auteur du message', inline: true },
            { name: '📝 Contenu', value: message.content ? (message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content) : '*Aucun contenu texte*', inline: false }
        ];
        if (message.attachments.size > 0) {
            fields.push({ name: '📎 Pièces jointes', value: message.attachments.map(att => att.name).join(', '), inline: false });
        }
        const embed = this.createLogEmbed('�️ Message supprimé', `Message supprimé dans ${message.channel}`, fields, '#ffc107');
        await this.sendLog(embed);
    }

    async logMessageEdit(oldMessage, newMessage) {
        if (!this.config.enabledEvents.messages || oldMessage.author.bot || oldMessage.content === newMessage.content) return;
        const embed = this.createLogEmbed('✏️ Message édité', `Message édité dans ${newMessage.channel}`, [
            { name: '👤 Auteur', value: `${newMessage.author.tag}\n\`${newMessage.author.id}\``, inline: true },
            { name: '📍 Salon', value: `${newMessage.channel}\n[Aller au message](${newMessage.url})`, inline: true },
            { name: '📝 Ancien contenu', value: oldMessage.content ? (oldMessage.content.length > 512 ? oldMessage.content.substring(0, 509) + '...' : oldMessage.content) : '*Aucun contenu*', inline: false },
            { name: '📝 Nouveau contenu', value: newMessage.content ? (newMessage.content.length > 512 ? newMessage.content.substring(0, 509) + '...' : newMessage.content) : '*Aucun contenu*', inline: false }
        ], '#17a2b8');
        await this.sendLog(embed);
    }

    // === MEMBRES ===
    async logMemberJoin(member) {
        if (!this.config.enabledEvents.members) return;
        const embed = this.createLogEmbed('➕ Membre rejoint', `**${member.user.tag}** a rejoint le serveur`, [
            { name: '👤 Utilisateur', value: `${member.user.tag}\n\`${member.user.id}\``, inline: true },
            { name: '📅 Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '📊 Nombre de membres', value: member.guild.memberCount.toString(), inline: true }
        ], '#28a745', member.user);
        await this.sendLog(embed);
    }

    async logMemberLeave(member) {
        if (!this.config.enabledEvents.members) return;
        const fields = [
            { name: '👤 Utilisateur', value: `${member.user.tag}\n\`${member.user.id}\``, inline: true },
            { name: '📅 A rejoint', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Inconnu', inline: true },
            { name: '📊 Nombre de membres', value: member.guild.memberCount.toString(), inline: true }
        ];
        if (member.roles.cache.size > 1) {
            const roles = member.roles.cache.filter(role => role.id !== member.guild.id).map(role => role.name).join(', ');
            if (roles.length > 0) fields.push({ name: '🎭 Rôles', value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles, inline: false });
        }
        const embed = this.createLogEmbed('➖ Membre parti', `**${member.user.tag}** a quitté le serveur`, fields, '#dc3545', member.user);
        await this.sendLog(embed);
    }

    async logMemberUpdate(oldMember, newMember) {
        if (!this.config.enabledEvents.members) return;
        
        // Changement de pseudo
        if (oldMember.nickname !== newMember.nickname) {
            const embed = this.createLogEmbed('🧑‍🎓 Pseudo modifié', `**${newMember.user.tag}** a changé de pseudo`, [
                { name: '👤 Utilisateur', value: `${newMember.user.tag}\n\`${newMember.user.id}\``, inline: true },
                { name: '📝 Ancien pseudo', value: oldMember.nickname || oldMember.user.username, inline: true },
                { name: '📝 Nouveau pseudo', value: newMember.nickname || newMember.user.username, inline: true }
            ], '#17a2b8', newMember.user);
            await this.sendLog(embed);
        }

        // Changement de rôles
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        
        if (addedRoles.size > 0 || removedRoles.size > 0) {
            const fields = [{ name: '👤 Utilisateur', value: `${newMember.user.tag}\n\`${newMember.user.id}\``, inline: false }];
            if (addedRoles.size > 0) fields.push({ name: '➕ Rôles ajoutés', value: addedRoles.map(role => role.toString()).join(', '), inline: false });
            if (removedRoles.size > 0) fields.push({ name: '➖ Rôles retirés', value: removedRoles.map(role => role.name).join(', '), inline: false });
            
            const embed = this.createLogEmbed('🎭 Rôles modifiés', `Les rôles de **${newMember.user.tag}** ont été modifiés`, fields, '#9b59b6', newMember.user);
            await this.sendLog(embed);
        }
    }

    async logUserUpdate(oldUser, newUser) {
        if (!this.config.enabledEvents.members || oldUser.username === newUser.username) return;
        const embed = this.createLogEmbed('👤 Nom d\'utilisateur modifié', `**${newUser.tag}** a changé de nom d'utilisateur`, [
            { name: '📝 Ancien nom', value: oldUser.username, inline: true },
            { name: '📝 Nouveau nom', value: newUser.username, inline: true },
            { name: '🆔 ID Utilisateur', value: `\`${newUser.id}\``, inline: true }
        ], '#17a2b8', newUser);
        await this.sendLog(embed);
    }

    // === SALONS ===
    async logChannelCreate(channel) {
        if (!this.config.enabledEvents.channels) return;
        const channelTypes = { 0: '💬 Textuel', 2: '🔊 Vocal', 4: '📁 Catégorie', 5: '📢 Annonces', 13: '🎤 Conférence' };
        const fields = [
            { name: '📝 Nom', value: channel.name, inline: true },
            { name: '🏷️ Type', value: channelTypes[channel.type] || `Type ${channel.type}`, inline: true },
            { name: '🆔 ID', value: `\`${channel.id}\``, inline: true }
        ];
        if (channel.parent) fields.push({ name: '📁 Catégorie', value: channel.parent.name, inline: true });
        const embed = this.createLogEmbed('📚 Salon créé', 'Un nouveau salon a été créé', fields, '#28a745');
        await this.sendLog(embed);
    }

    async logChannelDelete(channel) {
        if (!this.config.enabledEvents.channels) return;
        const channelTypes = { 0: '💬 Textuel', 2: '🔊 Vocal', 4: '📁 Catégorie', 5: '📢 Annonces', 13: '🎤 Conférence' };
        const fields = [
            { name: '📝 Nom', value: channel.name, inline: true },
            { name: '🏷️ Type', value: channelTypes[channel.type] || `Type ${channel.type}`, inline: true },
            { name: '🆔 ID', value: `\`${channel.id}\``, inline: true }
        ];
        if (channel.parent) fields.push({ name: '📁 Catégorie', value: channel.parent.name, inline: true });
        const embed = this.createLogEmbed('🗑️ Salon supprimé', 'Un salon a été supprimé', fields, '#dc3545');
        await this.sendLog(embed);
    }

    async logChannelUpdate(oldChannel, newChannel) {
        if (!this.config.enabledEvents.channels) return;
        const changes = [];
        if (oldChannel.name !== newChannel.name) changes.push(`**Nom:** ${oldChannel.name} → ${newChannel.name}`);
        if (oldChannel.topic !== newChannel.topic) changes.push(`**Sujet:** ${oldChannel.topic || 'Aucun'} → ${newChannel.topic || 'Aucun'}`);
        if (changes.length === 0) return;
        
        const embed = this.createLogEmbed('✏️ Salon modifié', `Le salon ${newChannel} a été modifié`, [
            { name: '📝 Modifications', value: changes.join('\n'), inline: false },
            { name: '🆔 ID', value: `\`${newChannel.id}\``, inline: true }
        ], '#ffc107');
        await this.sendLog(embed);
    }

    // === RÔLES ===
    async logRoleCreate(role) {
        if (!this.config.enabledEvents.roles) return;
        const embed = this.createLogEmbed('🏷️ Rôle créé', 'Un nouveau rôle a été créé', [
            { name: '📝 Nom', value: role.name, inline: true },
            { name: '🎨 Couleur', value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Aucune', inline: true },
            { name: '🆔 ID', value: `\`${role.id}\``, inline: true },
            { name: '📊 Position', value: role.position.toString(), inline: true },
            { name: '🏷️ Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true },
            { name: '🔒 Affiché séparément', value: role.hoist ? 'Oui' : 'Non', inline: true }
        ], role.color || '#99aab5');
        await this.sendLog(embed);
    }

    async logRoleDelete(role) {
        if (!this.config.enabledEvents.roles) return;
        const embed = this.createLogEmbed('🗑️ Rôle supprimé', 'Un rôle a été supprimé', [
            { name: '📝 Nom', value: role.name, inline: true },
            { name: '🎨 Couleur', value: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : 'Aucune', inline: true },
            { name: '🆔 ID', value: `\`${role.id}\``, inline: true }
        ], '#dc3545');
        await this.sendLog(embed);
    }

    async logRoleUpdate(oldRole, newRole) {
        if (!this.config.enabledEvents.roles) return;
        const changes = [];
        if (oldRole.name !== newRole.name) changes.push(`**Nom:** ${oldRole.name} → ${newRole.name}`);
        if (oldRole.color !== newRole.color) {
            const oldColor = oldRole.color ? `#${oldRole.color.toString(16).padStart(6, '0')}` : 'Aucune';
            const newColor = newRole.color ? `#${newRole.color.toString(16).padStart(6, '0')}` : 'Aucune';
            changes.push(`**Couleur:** ${oldColor} → ${newColor}`);
        }
        if (oldRole.mentionable !== newRole.mentionable) changes.push(`**Mentionnable:** ${oldRole.mentionable ? 'Oui' : 'Non'} → ${newRole.mentionable ? 'Oui' : 'Non'}`);
        if (oldRole.hoist !== newRole.hoist) changes.push(`**Affiché séparément:** ${oldRole.hoist ? 'Oui' : 'Non'} → ${newRole.hoist ? 'Oui' : 'Non'}`);
        if (changes.length === 0) return;
        
        const embed = this.createLogEmbed('✏️ Rôle modifié', `Le rôle ${newRole} a été modifié`, [
            { name: '📝 Modifications', value: changes.join('\n'), inline: false },
            { name: '🆔 ID', value: `\`${newRole.id}\``, inline: true }
        ], newRole.color || '#ffc107');
        await this.sendLog(embed);
    }

    // === SERVEUR ===
    async logGuildUpdate(oldGuild, newGuild) {
        if (!this.config.enabledEvents.server) return;
        const changes = [];
        if (oldGuild.name !== newGuild.name) changes.push(`**Nom:** ${oldGuild.name} → ${newGuild.name}`);
        if (oldGuild.iconURL() !== newGuild.iconURL()) changes.push(`**Icône:** Modifiée`);
        if (changes.length === 0) return;
        
        const embed = this.createLogEmbed('🖼️ Serveur modifié', 'Le serveur a été modifié', [
            { name: '📝 Modifications', value: changes.join('\n'), inline: false }
        ], '#9b59b6');
        if (newGuild.iconURL()) embed.setThumbnail(newGuild.iconURL({ dynamic: true, size: 256 }));
        await this.sendLog(embed);
    }

    // === INVITATIONS ===
    async logInviteCreate(invite) {
        if (!this.config.enabledEvents.invites) return;
        const embed = this.createLogEmbed('📩 Invitation créée', 'Une nouvelle invitation a été créée', [
            { name: '📝 Code', value: `\`${invite.code}\``, inline: true },
            { name: '📍 Salon', value: `${invite.channel}`, inline: true },
            { name: '👤 Créée par', value: invite.inviter ? `${invite.inviter.tag}\n\`${invite.inviter.id}\`` : 'Inconnu', inline: true },
            { name: '⏰ Expire', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'Jamais', inline: true },
            { name: '📊 Utilisations max', value: invite.maxUses || 'Illimitées', inline: true },
            { name: '🔄 Utilisations', value: `${invite.uses || 0}`, inline: true }
        ], '#28a745');
        await this.sendLog(embed);
    }

    async logInviteDelete(invite) {
        if (!this.config.enabledEvents.invites) return;
        const embed = this.createLogEmbed('🗑️ Invitation supprimée', 'Une invitation a été supprimée', [
            { name: '📝 Code', value: `\`${invite.code}\``, inline: true },
            { name: '📍 Salon', value: `${invite.channel}`, inline: true },
            { name: '👤 Créée par', value: invite.inviter ? `${invite.inviter.tag}\n\`${invite.inviter.id}\`` : 'Inconnu', inline: true },
            { name: '🔄 Utilisations', value: `${invite.uses || 0}`, inline: true }
        ], '#dc3545');
        await this.sendLog(embed);
    }

    // === FORUMS ===
    async logThreadCreate(thread) {
        if (!this.config.enabledEvents.forums || thread.type !== 11) return; // Type 11 = PUBLIC_THREAD dans un forum
        const embed = this.createLogEmbed('📝 Post de forum créé', 'Un nouveau post a été créé', [
            { name: '📝 Titre', value: thread.name, inline: true },
            { name: '📍 Forum', value: `${thread.parent}`, inline: true },
            { name: '👤 Auteur', value: thread.ownerId ? `<@${thread.ownerId}>\n\`${thread.ownerId}\`` : 'Inconnu', inline: true },
            { name: '🆔 ID', value: `\`${thread.id}\``, inline: true },
            { name: '🔗 Lien', value: `[Aller au post](https://discord.com/channels/${thread.guildId}/${thread.id})`, inline: true }
        ], '#17a2b8');
        await this.sendLog(embed);
    }

    async logThreadDelete(thread) {
        if (!this.config.enabledEvents.forums || thread.type !== 11) return; // Type 11 = PUBLIC_THREAD dans un forum
        const embed = this.createLogEmbed('🗑️ Post de forum supprimé', 'Un post de forum a été supprimé', [
            { name: '📝 Titre', value: thread.name, inline: true },
            { name: '📍 Forum', value: `${thread.parent}`, inline: true },
            { name: '👤 Auteur', value: thread.ownerId ? `<@${thread.ownerId}>\n\`${thread.ownerId}\`` : 'Inconnu', inline: true },
            { name: '🆔 ID', value: `\`${thread.id}\``, inline: true },
            { name: '📅 Créé le', value: thread.createdAt ? `<t:${Math.floor(thread.createdAt.getTime() / 1000)}:f>` : 'Inconnu', inline: true }
        ], '#dc3545');
        await this.sendLog(embed);
    }

    async logThreadUpdate(oldThread, newThread) {
        if (!this.config.enabledEvents.forums || newThread.type !== 11) return; // Type 11 = PUBLIC_THREAD dans un forum
        const changes = [];
        if (oldThread.name !== newThread.name) changes.push(`**Titre:** ${oldThread.name} → ${newThread.name}`);
        if (oldThread.archived !== newThread.archived) changes.push(`**Archivé:** ${oldThread.archived ? 'Oui' : 'Non'} → ${newThread.archived ? 'Oui' : 'Non'}`);
        if (oldThread.locked !== newThread.locked) changes.push(`**Verrouillé:** ${oldThread.locked ? 'Oui' : 'Non'} → ${newThread.locked ? 'Oui' : 'Non'}`);
        if (changes.length === 0) return;
        
        const embed = this.createLogEmbed('✏️ Post de forum modifié', `Le post **${newThread.name}** a été modifié`, [
            { name: '📝 Modifications', value: changes.join('\n'), inline: false },
            { name: '📍 Forum', value: `${newThread.parent}`, inline: true },
            { name: '🆔 ID', value: `\`${newThread.id}\``, inline: true },
            { name: '🔗 Lien', value: `[Aller au post](https://discord.com/channels/${newThread.guildId}/${newThread.id})`, inline: true }
        ], '#ffc107');
        await this.sendLog(embed);
    }

    // === EXPORT DES LOGS ===
    exportLogs(startDate, endDate) {
        const filteredLogs = this.logHistory.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });

        if (filteredLogs.length === 0) {
            return 'Aucun log trouvé pour cette période.';
        }

        let exportText = `=== EXPORT DES LOGS ===\n`;
        exportText += `Période: ${startDate.toLocaleString('fr-FR')} - ${endDate.toLocaleString('fr-FR')}\n`;
        exportText += `Nombre d'événements: ${filteredLogs.length}\n\n`;

        filteredLogs.forEach((log, index) => {
            exportText += `[${index + 1}] ${log.timestamp.toLocaleString('fr-FR')}\n`;
            exportText += `${log.title}\n`;
            if (log.description) exportText += `${log.description}\n`;
            
            if (log.fields && log.fields.length > 0) {
                log.fields.forEach(field => {
                    exportText += `  ${field.name}: ${field.value}\n`;
                });
            }
            exportText += `\n${'='.repeat(50)}\n\n`;
        });

        return exportText;
    }
}

module.exports = LogsSystem;
