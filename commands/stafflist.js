const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stafflist')
        .setDescription('Toon alle staff leden van deze server'),
    
    async execute(interaction, db) {
        const guildId = interaction.guild.id;
        const staffMembers = await db.getStaffMembers(guildId);
        
        if (staffMembers.length === 0) {
            return interaction.reply({
                content: '❌ Er zijn geen staff leden in deze server!',
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('👥 Staff Leden')
            .setDescription(`Totaal: ${staffMembers.length} staff leden`)
            .setTimestamp();
        
        let description = '';
        for (const staff of staffMembers) {
            try {
                const user = await interaction.client.users.fetch(staff.userId);
                const addedBy = await interaction.client.users.fetch(staff.addedBy);
                const addedDate = new Date(staff.addedAt).toLocaleDateString('nl-NL');
                
                description += `**${user.tag}** (${user.id})\n`;
                description += `└ Toegevoegd door: ${addedBy.tag} op ${addedDate}\n`;
                
                // Show log channel info
                if (staff.logChannelId) {
                    try {
                        const logChannel = await interaction.guild.channels.fetch(staff.logChannelId);
                        description += `└ Log kanaal: ${logChannel}\n\n`;
                    } catch {
                        description += `└ Log kanaal: ❌ Niet gevonden\n\n`;
                    }
                } else {
                    description += `└ Log kanaal: ❌ Niet ingesteld\n\n`;
                }
            } catch (error) {
                description += `**Onbekende gebruiker** (${staff.userId})\n`;
                description += `└ Toegevoegd op: ${new Date(staff.addedAt).toLocaleDateString('nl-NL')}\n`;
                description += `└ Log kanaal: ❌ Niet beschikbaar\n\n`;
            }
        }
        
        // Split long descriptions into multiple embeds if needed
        if (description.length > 4000) {
            const chunks = description.match(/[\s\S]{1,4000}/g) || [];
            for (let i = 0; i < chunks.length; i++) {
                const chunkEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setDescription(chunks[i]);
                
                if (i === 0) {
                    chunkEmbed.setTitle('👥 Staff Leden')
                        .addFields({ name: 'Totaal', value: `${staffMembers.length} staff leden`, inline: true });
                }
                
                if (i === chunks.length - 1) {
                    chunkEmbed.setTimestamp();
                }
                
                if (i === 0) {
                    await interaction.reply({ embeds: [chunkEmbed] });
                } else {
                    await interaction.followUp({ embeds: [chunkEmbed] });
                }
            }
        } else {
            embed.setDescription(description);
            await interaction.reply({ embeds: [embed] });
        }
    },
};