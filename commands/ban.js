const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban een gebruiker van de server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('De gebruiker om te bannen')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reden voor de ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_days')
                .setDescription('Aantal dagen berichten te verwijderen (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)),
    
    async execute(interaction, db) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Geen reden opgegeven';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        
        // Get the member object (might not exist if user already left)
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        // Check if user can be banned (if they're still in the server)
        if (targetMember && !targetMember.bannable) {
            return interaction.reply({
                content: '❌ Ik kan deze gebruiker niet bannen! Mogelijk heeft deze gebruiker hogere permissies.',
                ephemeral: true
            });
        }
        
        // Check if trying to ban a staff member
        const isTargetStaff = await db.isStaff(targetUser.id, interaction.guild.id);
        if (isTargetStaff && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Je kunt geen andere staff leden bannen!',
                ephemeral: true
            });
        }
        
        // Check if user is already banned
        try {
            const bans = await interaction.guild.bans.fetch();
            if (bans.has(targetUser.id)) {
                return interaction.reply({
                    content: '❌ Deze gebruiker is al geband!',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error checking bans:', error);
        }
        
        try {
            // Send DM to user before banning (if they're still in server)
            if (targetMember) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🔨 Je bent geband')
                        .setDescription(`Je bent geband van **${interaction.guild.name}**`)
                        .addFields(
                            { name: 'Reden', value: reason, inline: false },
                            { name: 'Staff lid', value: `${interaction.user.tag}`, inline: true },
                            { name: 'Tijd', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                        )
                        .setTimestamp();
                    
                    await targetUser.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.log('Could not send DM to user');
                }
            }
            
            // Ban the user
            await interaction.guild.members.ban(targetUser, {
                reason: `${reason} | Staff: ${interaction.user.tag}`,
                deleteMessageSeconds: deleteDays * 24 * 60 * 60
            });
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Gebruiker Geband')
                .setDescription(`${targetUser} is succesvol geband!`)
                .addFields(
                    { name: 'Gebruiker', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Staff lid', value: `${interaction.user}`, inline: true },
                    { name: 'Reden', value: reason, inline: false },
                    { name: 'Berichten verwijderd', value: `${deleteDays} dagen`, inline: true },
                    { name: 'Tijd', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setTimestamp()
                .setThumbnail(targetUser.displayAvatarURL());
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.reply({
                content: '❌ Er is een fout opgetreden bij het bannen van de gebruiker!',
                ephemeral: true
            });
        }
    },
};