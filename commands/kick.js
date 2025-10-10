const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick een gebruiker van de server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('De gebruiker om te kicken')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reden voor de kick')
                .setRequired(false)),
    
    async execute(interaction, db) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Geen reden opgegeven';
        
        // Get the member object
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        if (!targetMember) {
            return interaction.reply({
                content: '❌ Deze gebruiker is niet gevonden in de server!',
                ephemeral: true
            });
        }
        
        // Check if user can be kicked
        if (!targetMember.kickable) {
            return interaction.reply({
                content: '❌ Ik kan deze gebruiker niet kicken! Mogelijk heeft deze gebruiker hogere permissies.',
                ephemeral: true
            });
        }
        
        // Check if trying to kick a staff member
        const isTargetStaff = await db.isStaff(targetUser.id, interaction.guild.id);
        if (isTargetStaff && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Je kunt geen andere staff leden kicken!',
                ephemeral: true
            });
        }
        
        try {
            // Send DM to user before kicking
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff9500')
                    .setTitle('⚠️ Je bent gekickt')
                    .setDescription(`Je bent gekickt van **${interaction.guild.name}**`)
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
            
            // Kick the user
            await targetMember.kick(reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff9500')
                .setTitle('👢 Gebruiker Gekickt')
                .setDescription(`${targetUser} is succesvol gekickt!`)
                .addFields(
                    { name: 'Gebruiker', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Staff lid', value: `${interaction.user}`, inline: true },
                    { name: 'Reden', value: reason, inline: false },
                    { name: 'Tijd', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setTimestamp()
                .setThumbnail(targetUser.displayAvatarURL());
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error kicking user:', error);
            await interaction.reply({
                content: '❌ Er is een fout opgetreden bij het kicken van de gebruiker!',
                ephemeral: true
            });
        }
    },
};