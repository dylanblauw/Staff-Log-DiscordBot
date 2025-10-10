const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Geef een gebruiker een timeout')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('De gebruiker om een timeout te geven')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duur van de timeout in minuten')
                .setMinValue(1)
                .setMaxValue(40320) // 28 days max
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reden voor de timeout')
                .setRequired(false)),
    
    async execute(interaction, db) {
        const targetUser = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'Geen reden opgegeven';
        
        // Get the member object
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        if (!targetMember) {
            return interaction.reply({
                content: '❌ Deze gebruiker is niet gevonden in de server!',
                ephemeral: true
            });
        }
        
        // Check if user can be timed out
        if (!targetMember.moderatable) {
            return interaction.reply({
                content: '❌ Ik kan deze gebruiker geen timeout geven! Mogelijk heeft deze gebruiker hogere permissies.',
                ephemeral: true
            });
        }
        
        // Check if trying to timeout a staff member
        const isTargetStaff = await db.isStaff(targetUser.id, interaction.guild.id);
        if (isTargetStaff && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Je kunt geen andere staff leden een timeout geven!',
                ephemeral: true
            });
        }
        
        try {
            // Calculate timeout end time
            const timeoutEnd = new Date(Date.now() + duration * 60 * 1000);
            
            // Send DM to user before timeout
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff9500')
                    .setTitle('⏱️ Je hebt een timeout gekregen')
                    .setDescription(`Je hebt een timeout gekregen in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Duur', value: `${duration} minuten`, inline: true },
                        { name: 'Eindigt op', value: `<t:${Math.floor(timeoutEnd.getTime() / 1000)}:F>`, inline: true },
                        { name: 'Reden', value: reason, inline: false },
                        { name: 'Staff lid', value: `${interaction.user.tag}`, inline: true }
                    )
                    .setTimestamp();
                
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not send DM to user');
            }
            
            // Apply timeout
            await targetMember.timeout(duration * 60 * 1000, reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff9500')
                .setTitle('⏱️ Gebruiker Timeout')
                .setDescription(`${targetUser} heeft een timeout gekregen!`)
                .addFields(
                    { name: 'Gebruiker', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Staff lid', value: `${interaction.user}`, inline: true },
                    { name: 'Duur', value: `${duration} minuten`, inline: true },
                    { name: 'Eindigt op', value: `<t:${Math.floor(timeoutEnd.getTime() / 1000)}:F>`, inline: true },
                    { name: 'Reden', value: reason, inline: false }
                )
                .setTimestamp()
                .setThumbnail(targetUser.displayAvatarURL());
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error timing out user:', error);
            await interaction.reply({
                content: '❌ Er is een fout opgetreden bij het geven van een timeout!',
                ephemeral: true
            });
        }
    },
};