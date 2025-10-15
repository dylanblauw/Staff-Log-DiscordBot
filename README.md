# Discord Staff Management Bot

Een Discord bot die staff leden kan beheren en alle staff activiteiten logt in aparte kanalen.

## ✨ Features

- **Staff Management**: Staff leden toevoegen en verwijderen
- **Automatische Logging**: Alle staff commands worden automatisch gelogd
- **Moderatie Commands**: Kick, ban, timeout, warn commands
- **Log Channel Creatie**: Automatische aanmaak van log kanalen
- **Permissie Systeem**: Alleen staff en admins kunnen moderatie commands gebruiken

## 🚀 Setup

### 1. Bot Token instellen
1. Ga naar [Discord Developer Portal](https://discord.com/developers/applications)
2. Maak een nieuwe applicatie of selecteer een bestaande
3. Ga naar "Bot" sectie en kopieer de token
4. Vul je bot token in het `.env` bestand:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

### 2. Dependencies installeren
```bash
npm install
```

### 3. Bot uitnodigen naar server
Gebruik deze URL (vervang CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Of run het setup script voor automatische detectie:
```bash
npm run setup
```

### 4. Bot starten
```bash
npm start
```

**Automatische Guild Detection**: De bot detecteert automatisch de server waar hij in zit. Je hoeft geen GUILD_ID handmatig in te stellen!

## 🔧 Bot Permissies
Zorg ervoor dat je bot de volgende permissies heeft:
- `Send Messages`
- `Use Slash Commands`
- `Embed Links`
- `Manage Channels` (**Important**: for creating individual log channels)
- `Kick Members`
- `Ban Members`
- `Moderate Members` (for timeouts)

### 3. Start the Bot
```bash
npm start
```

### 4. Initial Setup in Discord
1. Use `/addstaff @user` to add your first staff members (each gets their own log channel)
2. Use `/setuplog info` to see information about the individual log system
3. Staff members can now use moderation commands and their actions will be logged in their personal channels

## 📋 Commands

### 👥 Staff Management
- `/addstaff <user>` - Add a member to the staff team (Admin only)
- `/removestaff <user>` - Remove a member from the staff team (Admin only)
- `/stafflist` - Show all staff members

### ⚔️ Moderation (Staff only)
- `/kick <user> [reason]` - Kick a user from the server
- `/ban <user> [reason] [delete_days]` - Ban a user from the server
- `/timeout <user> <duration> [reason]` - Give a user a timeout (1-40320 minutes)
- `/warn <user> <reason>` - Give a user a warning

### 🛠️ Utility
- `/help` - Show all available commands
- `/setuplog info` - Show information about individual log system (Admin only)
- `/setuplog recreate` - Recreate missing staff log channels (Admin only)

## 📊 Individual Logging System

**NEW: Each staff member gets their own personal log channel!**

The bot automatically creates and manages individual log channels:
- **Personal Channels**: Each staff member gets a `#staff-logs-username` channel
- **Individual Logging**: Only their own actions are logged in their channel
- **Automatic Management**: Channels are created when adding staff, deleted when removing staff
- **Private Access**: Only the staff member and admins can view their log channel

### What gets logged in each personal channel:
- All moderation commands executed by that staff member (kick, ban, timeout, warn)
- Command arguments, targets, and timestamps
- Channel where the command was executed

### Managing Log Channels
Use `/setuplog` to manage the individual log system:
- `/setuplog info` - Show information about the system
- `/setuplog recreate` - Recreate missing channels for existing staff

## 🗃️ Database

The bot uses a simple JSON-based database system:
- `data/staff.json` - Staff member information including their personal log channel IDs
- `data/logchannels.json` - Legacy global log channel settings (kept for compatibility)
- `data/guilds.json` - Server-specific settings

## 🔒 Permission System

- **Owner**: Can do everything (set via OWNER_ID in .env)
- **Administrator**: Can add/remove staff members and set up log channels
- **Staff**: Can use moderation commands
- **Members**: Can only use basic commands

## 🚨 Error Handling

The bot has extensive error handling:
- Checks if users exist before performing actions
- Prevents staff members from moderating each other (except owner)
- Sends DMs to users for kicks/bans/timeouts
- Logs all errors to the console

## 📁 Project Structure

```
discordbots/
├── commands/           # All slash commands
│   ├── addstaff.js    # Add staff member
│   ├── removestaff.js # Remove staff member
│   ├── stafflist.js   # Show staff list
│   ├── setuplog.js    # Set up log channel
│   ├── kick.js        # Kick command
│   ├── ban.js         # Ban command
│   ├── timeout.js     # Timeout command
│   ├── warn.js        # Warn command
│   └── help.js        # Help command
├── data/              # Database files (created automatically)
├── database.js        # Database handler
├── index.js           # Main bot file
├── package.json       # Dependencies and scripts
├── .env              # Bot token and configuration
└── README.md         # This file
```

## 🔧 Development

### Dependencies
- `discord.js` - Discord API wrapper
- `dotenv` - Environment variables

### Scripts
- `npm start` - Start the bot
- `npm run dev` - Start the bot (alias for start)

## 📝 Notes

- All times are displayed in Discord's timestamp format
- The bot automatically registers all slash commands on startup
- Staff cannot moderate other staff members (except the owner)
- DMs are sent to users before they are moderated
- Log channels are automatically created if they don't exist