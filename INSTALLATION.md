# 📦 Installatie Instructies - Staff Log Discord Bot

## 🎯 Snelle Start

### 1. Download & Extract
1. Download de nieuwste release van [GitHub](https://github.com/dylanblauw/Staff-Log-DiscordBot/releases)
2. Extract de ZIP naar een map naar keuze
3. Open terminal/command prompt in die map

### 2. Dependencies Installeren
```bash
npm install
```

### 3. Bot Token Instellen
1. **Kopieer** `.env.example` naar `.env`
2. **Ga naar** [Discord Developer Portal](https://discord.com/developers/applications)
3. **Maak** nieuwe applicatie of selecteer bestaande
4. **Kopieer waardes** naar je `.env` bestand:

```env
CLIENT_ID=your_client_id_here
DISCORD_TOKEN=your_bot_token_here
```

### 4. Bot Uitnodigen
Gebruik deze URL (vervang YOUR_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 5. Bot Starten
```bash
npm start
```

## ✅ Automatische Setup
Voor automatische server detectie:
```bash
npm run setup
```

## 🔧 Requirements
- **Node.js** 16.0.0 of hoger
- **NPM** of **Yarn**
- **Discord Bot Token**

## 🆘 Problemen?
- Controleer of Node.js geïnstalleerd is: `node --version`
- Controleer of bot token correct is in `.env`
- Zorg dat bot uitgenodigd is naar je server
- Check console voor error messages

## 📞 Support
Voor support, bezoek [Rootline Studio](https://rootlinestudio.nl) of open een issue op GitHub.