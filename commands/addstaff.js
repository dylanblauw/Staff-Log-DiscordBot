const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addstaff')
        .setDescription('Voeg een lid toe aan het staff team')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('De gebruiker om toe te voegen aan staff')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction, db) {
        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        
        // Check if user is already staff
        const isAlreadyStaff = await db.isStaff(targetUser.id, guildId);
        if (isAlreadyStaff) {
            return interaction.reply({
                content: `❌ ${targetUser.tag} is al een staff lid!`,
                ephemeral: true
            });
        }
        
        await interaction.deferReply();
        
        try {
            // Create individual log channel for this staff member
            const channelName = `staff-logs-${targetUser.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            const logChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                topic: `Personal staff activity logs for ${targetUser.tag}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.EmbedLinks
                        ],
                    },
                    {
                        id: targetUser.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                    }
                ],
            });
            
            // Add user to staff with their log channel
            await db.addStaff(targetUser.id, guildId, interaction.user.id, logChannel.id);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Staff Lid Toegevoegd')
                .setDescription(`${targetUser} is succesvol toegevoegd aan het staff team!`)
                .addFields(
                    { name: 'Toegevoegd door', value: `${interaction.user}`, inline: true },
                    { name: 'Log Kanaal', value: `${logChannel}`, inline: true },
                    { name: 'Tijd', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setTimestamp()
                .setThumbnail(targetUser.displayAvatarURL());
            
            await interaction.editReply({ embeds: [embed] });
            
            // Send welcome message to the new staff log channel
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('� Personal Staff Log Channel')
                .setDescription(`Welcome ${targetUser}! This is your personal staff activity log channel.`)
                .addFields(
                    { name: 'What is logged here?', value: '• All your moderation commands (kick, ban, timeout, warn)\n• Timestamps and command details\n• User targets and reasons', inline: false },
                    { name: 'Added by', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                    { name: 'Added on', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setTimestamp();
            
            await logChannel.send({ embeds: [welcomeEmbed] });
            
        } catch (error) {
            console.error('Error adding staff member:', error);
            await interaction.editReply({
                content: '❌ Er is een fout opgetreden bij het toevoegen van het staff lid!',
            });
        }
    },
};