const { Client, GatewayIntentBits, Collection, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildModeration
    ]
});

// Collections voor commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] Het command in ${filePath} mist een vereiste "data" of "execute" property.`);
    }
}

// Load database helper
const Database = require('./database');
const db = new Database();

client.once('ready', async () => {
    console.log(`🤖 Bot is online als ${client.user.tag}!`);
    
    // Automatische Guild Detection
    if (!process.env.GUILD_ID || process.env.GUILD_ID === 'auto' || process.env.GUILD_ID === 'your_server_id_here') {
        const guild = client.guilds.cache.first();
        if (guild) {
            console.log(`\n✅ Bot automatisch gedetecteerd in server: ${guild.name} (${guild.id})`);
            console.log(`📝 Voor betere prestaties, voeg GUILD_ID=${guild.id} toe aan je .env bestand\n`);
            process.env.GUILD_ID = guild.id;
        } else {
            console.log('\n⚠️  Geen servers gevonden! Zorg ervoor dat de bot is uitgenodigd naar een server.\n');
        }
    } else {
        console.log(`\n✅ Gebruik handmatig ingestelde GUILD_ID: ${process.env.GUILD_ID}\n`);
    }
    
    // Initialiseer database
    await db.init();
    
    // Register slash commands
    try {
        console.log('Started refreshing application (/) commands.');
        
        const commands = [];
        client.commands.forEach(command => {
            commands.push(command.data.toJSON());
        });
        
        await client.application.commands.set(commands);
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Geen command gevonden voor ${interaction.commandName}.`);
        return;
    }

    try {
        // Check if user is staff for protected commands
        const staffCommands = ['kick', 'ban', 'mute', 'timeout', 'warn'];
        if (staffCommands.includes(interaction.commandName)) {
            const isStaff = await db.isStaff(interaction.user.id, interaction.guild.id);
            const isOwner = interaction.user.id === process.env.OWNER_ID;
            
            if (!isStaff && !isOwner) {
                return interaction.reply({ 
                    content: '❌ Je hebt geen toestemming om dit command te gebruiken. Je moet staff zijn!', 
                    ephemeral: true 
                });
            }
        }

        await command.execute(interaction, db);
        
        // Log command usage als het een staff command is
        if (staffCommands.includes(interaction.commandName)) {
            await logStaffAction(interaction, db);
        }
    } catch (error) {
        console.error('Error executing command:', error);
        const reply = { 
            content: 'Er was een error bij het uitvoeren van dit command!', 
            ephemeral: true 
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

// Log staff actions to individual staff member's channel
async function logStaffAction(interaction, db) {
    try {
        // Get the staff member's personal log channel
        const staffLogChannelId = await db.getStaffLogChannel(interaction.user.id, interaction.guild.id);
        if (!staffLogChannelId) {
            console.log(`No personal log channel found for staff member ${interaction.user.tag}`);
            return;
        }
        
        const logChannel = await interaction.guild.channels.fetch(staffLogChannelId);
        if (!logChannel) {
            console.log(`Personal log channel not found for staff member ${interaction.user.tag}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ff9500')
            .setTitle('📋 Staff Action Logged')
            .addFields(
                { name: 'Command', value: `\`/${interaction.commandName}\``, inline: true },
                { name: 'Channel', value: `${interaction.channel}`, inline: true },
                { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setTimestamp();
        
        // Add command arguments if present
        if (interaction.options.data.length > 0) {
            const args = interaction.options.data.map(option => {
                let value = option.value;
                // If it's a user option, show the user tag
                if (option.type === 6) { // USER type
                    const user = interaction.options.getUser(option.name);
                    value = `${user.tag} (${user.id})`;
                }
                return `${option.name}: ${value}`;
            }).join('\n');
            embed.addFields({ name: 'Arguments', value: `\`\`\`${args}\`\`\``, inline: false });
        }
        
        // Add footer with staff member info
        embed.setFooter({ 
            text: `${interaction.user.tag}`, 
            iconURL: interaction.user.displayAvatarURL() 
        });
        
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging staff action:', error);
    }
}

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.BOT_TOKEN);