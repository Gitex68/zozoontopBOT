const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const EmbedManager = require('../../utils/embedManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voicesetup')
        .setDescription('Configure le système de salons vocaux privés')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const guild = interaction.guild;
            const voiceSystem = interaction.client.voiceSystem;

            if (!voiceSystem) {
                return await interaction.editReply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur',
                        'Le système de salons vocaux n\'est pas initialisé.'
                    )]
                });
            }

            // Utiliser la méthode setupVoiceSystem de la classe VoiceSystem
            const result = await voiceSystem.setupVoiceSystem(guild);

            if (result.success) {
                const embed = EmbedManager.createEmbed({
                    title: '✅ Configuration des salons privés',
                    description: 'Le système de salons privés est prêt !\nRejoignez le salon "➕ Créer votre salon" pour créer votre propre salon vocal.',
                    fields: [
                        {
                            name: '🗂️ Catégorie',
                            value: result.category.name,
                            inline: true
                        },
                        {
                            name: '🎧 Salon de création',
                            value: result.createChannel.name,
                            inline: true
                        }
                    ],
                    color: '#28a745'
                });

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({
                    embeds: [EmbedManager.createErrorEmbed(
                        'Erreur de configuration',
                        `Une erreur est survenue : ${result.error}`
                    )]
                });
            }

        } catch (error) {
            console.error('❌ Erreur lors de la configuration des salons vocaux:', error);
            
            const embed = EmbedManager.createErrorEmbed(
                'Erreur',
                'Une erreur est survenue lors de la configuration des salons vocaux.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};