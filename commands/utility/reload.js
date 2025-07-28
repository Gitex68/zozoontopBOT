const { SlashCommandBuilder } = require('discord.js');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Recharge les commandes du bot.')
        .addStringOption(option => // permet de créer une variable à la commande.
            option.setName('command') 
                .setDescription('La commande à recharger.')
                .setRequired(true)), 
    async execute(interaction) {
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply(`There is no command with name \`${commandName}\`!`);
        }
        const commandsPath = path.join(__dirname, '..');
        let commandFilePath;
        const folders = require('node:fs').readdirSync(commandsPath);
        for (const folder of folders) {
            const possiblePath = path.join(commandsPath, folder, `${commandName}.js`);
            if (require('node:fs').existsSync(possiblePath)) {
                commandFilePath = possiblePath;
                break;
            }
        }

        if (!commandFilePath) {
            return interaction.reply(`Impossible de trouver le fichier pour la commande \`${commandName}\`.`);
        }

        // Supprimer du cache et recharger
        delete require.cache[require.resolve(commandFilePath)];

        try {
            const newCommand = require(commandFilePath);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            await interaction.reply(`La commande \`${newCommand.data.name}\` été rechargé!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
        }
    },
};