const fs = require('node:fs');
const path = require('node:path');

class Database {
    constructor() {
        this.dataPath = path.join(__dirname, 'data');
        this.staffFile = path.join(this.dataPath, 'staff.json');
        this.logChannelsFile = path.join(this.dataPath, 'logchannels.json');
        this.guildsFile = path.join(this.dataPath, 'guilds.json');
        
        this.staff = new Map();
        this.logChannels = new Map();
        this.guilds = new Map();
    }

    async init() {
        // Create data directory if it doesn't exist
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath);
        }

        // Load existing data
        await this.loadData();
    }

    async loadData() {
        try {
            // Load staff data
            if (fs.existsSync(this.staffFile)) {
                const staffData = JSON.parse(fs.readFileSync(this.staffFile, 'utf8'));
                this.staff = new Map(Object.entries(staffData));
            }

            // Load log channels data
            if (fs.existsSync(this.logChannelsFile)) {
                const logData = JSON.parse(fs.readFileSync(this.logChannelsFile, 'utf8'));
                this.logChannels = new Map(Object.entries(logData));
            }

            // Load guilds data
            if (fs.existsSync(this.guildsFile)) {
                const guildsData = JSON.parse(fs.readFileSync(this.guildsFile, 'utf8'));
                this.guilds = new Map(Object.entries(guildsData));
            }

            console.log('✅ Database data loaded successfully');
        } catch (error) {
            console.error('Error loading database:', error);
        }
    }

    async saveData() {
        try {
            // Save staff data
            const staffObj = Object.fromEntries(this.staff);
            fs.writeFileSync(this.staffFile, JSON.stringify(staffObj, null, 2));

            // Save log channels data
            const logObj = Object.fromEntries(this.logChannels);
            fs.writeFileSync(this.logChannelsFile, JSON.stringify(logObj, null, 2));

            // Save guilds data
            const guildsObj = Object.fromEntries(this.guilds);
            fs.writeFileSync(this.guildsFile, JSON.stringify(guildsObj, null, 2));

        } catch (error) {
            console.error('Error saving database:', error);
        }
    }

    // Staff management methods
    async addStaff(userId, guildId, addedBy, logChannelId = null) {
        const key = `${guildId}_${userId}`;
        this.staff.set(key, {
            userId: userId,
            guildId: guildId,
            addedBy: addedBy,
            addedAt: new Date().toISOString(),
            logChannelId: logChannelId
        });
        await this.saveData();
    }

    async removeStaff(userId, guildId) {
        const key = `${guildId}_${userId}`;
        const removed = this.staff.delete(key);
        if (removed) {
            await this.saveData();
        }
        return removed;
    }

    async isStaff(userId, guildId) {
        const key = `${guildId}_${userId}`;
        return this.staff.has(key);
    }

    async getStaffMembers(guildId) {
        const staffMembers = [];
        for (const [key, data] of this.staff) {
            if (data.guildId === guildId) {
                staffMembers.push(data);
            }
        }
        return staffMembers;
    }

    // Individual staff log channel methods
    async setStaffLogChannel(userId, guildId, channelId) {
        const key = `${guildId}_${userId}`;
        const staffData = this.staff.get(key);
        if (staffData) {
            staffData.logChannelId = channelId;
            this.staff.set(key, staffData);
            await this.saveData();
        }
    }

    async getStaffLogChannel(userId, guildId) {
        const key = `${guildId}_${userId}`;
        const staffData = this.staff.get(key);
        return staffData ? staffData.logChannelId : null;
    }

    // Legacy global log channel methods (keeping for backward compatibility)
    async setLogChannel(guildId, channelId) {
        this.logChannels.set(guildId, channelId);
        await this.saveData();
    }

    async getLogChannel(guildId) {
        return this.logChannels.get(guildId);
    }

    async removeLogChannel(guildId) {
        const removed = this.logChannels.delete(guildId);
        if (removed) {
            await this.saveData();
        }
        return removed;
    }

    // Guild settings methods
    async getGuildSettings(guildId) {
        return this.guilds.get(guildId) || {
            guildId: guildId,
            prefix: '!',
            muteRole: null,
            autoRole: null,
            welcomeChannel: null
        };
    }

    async updateGuildSettings(guildId, settings) {
        this.guilds.set(guildId, { ...await this.getGuildSettings(guildId), ...settings });
        await this.saveData();
    }
}

module.exports = Database;