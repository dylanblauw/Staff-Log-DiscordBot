const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🤖 === DISCORD BOT SETUP ===\n');

// Check if token exists
if (!process.env.DISCORD_TOKEN && !process.env.BOT_TOKEN) {
    console.log('❌ Geen bot token gevonden!');
    console.log('📝 Voeg je DISCORD_TOKEN toe aan het .env bestand');
    console.log('🔗 Krijg je token van: https://discord.com/developers/applications\n');
    process.exit(1);
}

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

client.once('ready', () => {
    console.log(`✅ Ingelogd als ${client.user.tag}!\n`);
    
    if (client.guilds.cache.size === 0) {
        console.log('⚠️  De bot is in geen enkele server!');
        console.log('🔗 Gebruik deze URL om de bot uit te nodigen:');
        console.log(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands\n`);
        process.exit(0);
    }
    
    console.log('🌐 Beschikbare servers:');
    client.guilds.cache.forEach((guild, index) => {
        console.log(`   ${index + 1}. ${guild.name} (ID: ${guild.id})`);
    });
    
    console.log('\n📋 Opties:');
    console.log('1. Laat de bot automatisch de server detecteren (aanbevolen)');
    console.log('2. Kopieer een van de IDs hierboven en voeg toe aan .env:');
    console.log('   GUILD_ID=your_chosen_id_here');
    console.log('\n✨ Start de bot met: npm start of node index.js');
    
    process.exit(0);
});

client.on('error', error => {
    console.error('❌ Bot error:', error.message);
    process.exit(1);
});

const token = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;
client.login(token).catch(error => {
    console.error('❌ Kan niet inloggen:', error.message);
    console.log('🔍 Controleer je bot token in het .env bestand');
    process.exit(1);
});