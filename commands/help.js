const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Toon alle beschikbare commands'),
    
    async execute(interaction, db) {
        const isStaff = await db.isStaff(interaction.user.id, interaction.guild.id);
        const isOwner = interaction.user.id === process.env.OWNER_ID;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 Bot Help - Commands')
            .setDescription('Hier zijn alle beschikbare commands:')
            .setTimestamp();
        
        // General commands
        embed.addFields({
            name: '📋 Algemene Commands',
            value: '`/help` - Toon deze help pagina\n`/stafflist` - Toon alle staff leden',
            inline: false
        });
        
        // Staff commands
        if (isStaff || isOwner) {
            embed.addFields({
                name: '⚔️ Staff Commands',
                value: '`/kick <user> [reason]` - Kick een gebruiker\n`/ban <user> [reason] [delete_days]` - Ban een gebruiker\n`/timeout <user> <duration> [reason]` - Geef een gebruiker een timeout\n`/warn <user> <reason>` - Waarschuw een gebruiker',
                inline: false
            });
        }
        
        // Admin commands
        if (isOwner || interaction.member.permissions.has('Administrator')) {
            embed.addFields({
                name: '🛡️ Administrator Commands',
                value: '`/addstaff <user>` - Voeg een staff lid toe\n`/removestaff <user>` - Verwijder een staff lid\n`/setuplog [channel]` - Stel log kanaal in',
                inline: false
            });
        }
        
        // Add footer with info
        embed.setFooter({ 
            text: `Jouw status: ${isOwner ? 'Owner' : isStaff ? 'Staff' : 'Member'}`,
            iconURL: interaction.user.displayAvatarURL()
        });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};