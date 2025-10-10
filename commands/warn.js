const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Geef een gebruiker een waarschuwing')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('De gebruiker om te waarschuwen')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reden voor de waarschuwing')
                .setRequired(true)),
    
    async execute(interaction, db) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        
        // Get the member object
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        if (!targetMember) {
            return interaction.reply({
                content: '❌ Deze gebruiker is niet gevonden in de server!',
                ephemeral: true
            });
        }
        
        // Check if trying to warn a staff member
        const isTargetStaff = await db.isStaff(targetUser.id, interaction.guild.id);
        if (isTargetStaff && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Je kunt geen andere staff leden waarschuwen!',
                ephemeral: true
            });
        }
        
        try {
            // Send DM to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setTitle('⚠️ Je hebt een waarschuwing gekregen')
                    .setDescription(`Je hebt een waarschuwing gekregen in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reden', value: reason, inline: false },
                        { name: 'Staff lid', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Tijd', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                    )
                    .setFooter({ text: 'Let op je gedrag om verdere sancties te voorkomen!' })
                    .setTimestamp();
                
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not send DM to user');
            }
            
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('⚠️ Gebruiker Gewaarschuwd')
                .setDescription(`${targetUser} heeft een waarschuwing gekregen!`)
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
            console.error('Error warning user:', error);
            await interaction.reply({
                content: '❌ Er is een fout opgetreden bij het waarschuwen van de gebruiker!',
                ephemeral: true
            });
        }
    },
};