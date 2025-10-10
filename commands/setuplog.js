const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplog')
        .setDescription('Manage staff log channels - now each staff member gets their own channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show information about the individual staff log system'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('recreate')
                .setDescription('Recreate missing log channels for existing staff members'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction, db) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        
        await interaction.deferReply();
        
        if (subcommand === 'info') {
            const staffMembers = await db.getStaffMembers(guildId);
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📋 Individual Staff Log System')
                .setDescription('This bot now uses individual log channels for each staff member!')
                .addFields(
                    { name: 'How it works', value: '• Each staff member gets their own personal log channel\n• Format: `#staff-logs-username`\n• Only logs their own actions\n• Automatically created when adding staff', inline: false },
                    { name: 'Current Staff', value: staffMembers.length > 0 ? `${staffMembers.length} staff members` : 'No staff members yet', inline: true },
                    { name: 'Commands', value: '• `/addstaff` - Creates personal log channel\n• `/removestaff` - Deletes personal log channel\n• `/setuplog recreate` - Fix missing channels', inline: false }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
        } else if (subcommand === 'recreate') {
            const staffMembers = await db.getStaffMembers(guildId);
            
            if (staffMembers.length === 0) {
                return interaction.editReply({
                    content: '❌ No staff members found to recreate channels for!'
                });
            }
            
            let recreated = 0;
            let errors = 0;
            
            for (const staff of staffMembers) {
                try {
                    // Check if channel already exists
                    const existingChannelId = await db.getStaffLogChannel(staff.userId, guildId);
                    if (existingChannelId) {
                        try {
                            await interaction.guild.channels.fetch(existingChannelId);
                            continue; // Channel exists, skip
                        } catch {
                            // Channel doesn't exist, create new one
                        }
                    }
                    
                    const user = await interaction.client.users.fetch(staff.userId);
                    const channelName = `staff-logs-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                    
                    const logChannel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        topic: `Personal staff activity logs for ${user.tag}`,
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
                                id: user.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            }
                        ],
                    });
                    
                    await db.setStaffLogChannel(staff.userId, guildId, logChannel.id);
                    recreated++;
                    
                } catch (error) {
                    console.error(`Error recreating channel for staff ${staff.userId}:`, error);
                    errors++;
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor(errors > 0 ? '#ff9500' : '#00ff00')
                .setTitle('� Channel Recreation Complete')
                .addFields(
                    { name: 'Recreated', value: `${recreated} channels`, inline: true },
                    { name: 'Errors', value: `${errors} failed`, inline: true },
                    { name: 'Total Staff', value: `${staffMembers.length} members`, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        }
    },
};