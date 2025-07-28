const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

class EmbedManager {
    static getDefaultColor() {
        return config.colors?.default || '#77bd88';
    }

    static getLogsColor() {
        return config.colors?.logs || '#246e0a';
    }

    static createEmbed(options = {}) {
        const embed = new EmbedBuilder();
        
        if (options.title) embed.setTitle(options.title);
        if (options.description) embed.setDescription(options.description);
        if (options.color) {
            embed.setColor(options.color);
        } else {
            embed.setColor(this.getDefaultColor());
        }
        if (options.fields) {
            for (const field of options.fields) {
                embed.addFields(field);
            }
        }
        if (options.footer) embed.setFooter(options.footer);
        if (options.timestamp) embed.setTimestamp(options.timestamp);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        
        return embed;
    }

    static createSuccessEmbed(title, description) {
        return this.createEmbed({
            title: `✅ ${title}`,
            description,
            color: '#28a745'
        });
    }

    static createErrorEmbed(title, description) {
        return this.createEmbed({
            title: `❌ ${title}`,
            description,
            color: '#dc3545'
        });
    }

    static createWarningEmbed(title, description) {
        return this.createEmbed({
            title: `⚠️ ${title}`,
            description,
            color: '#ffc107'
        });
    }

    static createInfoEmbed(title, description) {
        return this.createEmbed({
            title: `ℹ️ ${title}`,
            description,
            color: '#17a2b8'
        });
    }
}

module.exports = EmbedManager;
