const { SlashCommandBuilder, MessageFlags } = require(`discord.js`);

module.exports = {
    cooldown: 2,
    data : new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Vous répond simplement avec "Pong".'),
    async execute(interaction) {
        await interaction.reply({content: 'Pong !', flags: MessageFlags.Ephemeral});
    },
};