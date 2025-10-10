const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removestaff')
        .setDescription('Verwijder een lid van het staff team')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('De gebruiker om te verwijderen van staff')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction, db) {
        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        
        // Check if user is staff
        const isStaff = await db.isStaff(targetUser.id, guildId);
        if (!isStaff) {
            return interaction.reply({
                content: `❌ ${targetUser.tag} is geen staff lid!`,
                ephemeral: true
            });
        }
        
        // Get staff member's log channel before removing
        const staffLogChannelId = await db.getStaffLogChannel(targetUser.id, guildId);
        
        // Remove user from staff
        await db.removeStaff(targetUser.id, guildId);
        
        let channelDeleted = false;
        
        // Try to delete their personal log channel
        if (staffLogChannelId) {
            try {
                const staffLogChannel = await interaction.guild.channels.fetch(staffLogChannelId);
                if (staffLogChannel) {
                    // Send goodbye message before deletion
                    const goodbyeEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('👋 Staff Privileges Removed')
                        .setDescription(`${targetUser.tag} has been removed from the staff team.`)
                        .addFields(
                            { name: 'Removed by', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                        )
                        .setFooter({ text: 'This channel will be deleted in 10 seconds...' })
                        .setTimestamp();
                    
                    await staffLogChannel.send({ embeds: [goodbyeEmbed] });
                    
                    // Delete channel after a short delay
                    setTimeout(async () => {
                        try {
                            await staffLogChannel.delete('Staff member removed');
                        } catch (error) {
                            console.error('Error deleting staff log channel:', error);
                        }
                    }, 10000);
                    
                    channelDeleted = true;
                }
            } catch (error) {
                console.error('Error handling staff log channel:', error);
            }
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Staff Lid Verwijderd')
            .setDescription(`${targetUser} is verwijderd van het staff team!`)
            .addFields(
                { name: 'Verwijderd door', value: `${interaction.user}`, inline: true },
                { name: 'Log Kanaal', value: channelDeleted ? 'Wordt verwijderd...' : 'Niet gevonden', inline: true },
                { name: 'Tijd', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setTimestamp()
            .setThumbnail(targetUser.displayAvatarURL());
        
        await interaction.reply({ embeds: [embed] });
    },
};