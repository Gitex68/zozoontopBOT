const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { colors } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("Affiche la liste des commandes et leur description."),
    async execute(interaction) {
        const commandsDir = path.join(__dirname, '../../commands'); 
        let commandes = [];
        fs.readdirSync(commandsDir, { withFileTypes: true }).forEach(dirent => {
            if (dirent.isDirectory()) {
                const subDir = path.join(commandsDir, dirent.name);
                fs.readdirSync(subDir).forEach(file => {
                    if (file.endsWith('.js')) {
                        const cmd = require(path.join(subDir, file));
                        if (cmd.data) {
                            commandes.push({
                                name: cmd.data.name,
                                description: cmd.data.description
                            });
                        }
                    }
                });
            }
        });
        const embed = new EmbedBuilder()
            .setTitle("Menu d'aide")
            .setDescription("Liste des commandes disponibles :")
            .setColor(colors.default);

        commandes.forEach(cmd => {
            embed.addFields({ name: `/${cmd.name}`, value: cmd.description || "Aucune description", inline: false });
        });

        await interaction.reply({ embeds: [embed]});
    },
};