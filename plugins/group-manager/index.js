const MusicManager = require('./music-manager');
const ComedyManager = require('./comedy-manager');
const ContentDownloader = require('./content-downloader');
const Scheduler = require('./scheduler');
const BroadcastManager = require('./broadcast');
const { ensureDownloadDir } = require('./utils');

class GroupManager {
    constructor(sock) {
        this.sock = sock;
        this.isRunning = false;
        this.socketReady = false;
        
        this.channels = {
            music: '0029VbBn8li3LdQQcJbvwm2S@g.us',
            entertainment: '0029Vb6GzqcId7nWURAdJv0M@g.us'
        };

        this.channelLinks = {
            music: 'https://whatsapp.com/channel/0029VbBn8li3LdQQcJbvwm2S',
            entertainment: 'https://whatsapp.com/channel/0029Vb6GzqcId7nWURAdJv0M'
        };

        this.musicManager = new MusicManager(sock, this.channels);
        this.comedyManager = new ComedyManager(sock, this.channels);
        this.downloader = new ContentDownloader();
        this.scheduler = new Scheduler();
        this.broadcastManager = new BroadcastManager(sock);
        
        this.joinedGroups = new Set();
        this.channelMessages = [
            "🎵 *Daily Music Update* 🎵\nFresh tracks dropping every day!\nStay tuned for the hottest music!",
            "🎭 *Entertainment Alert* 🎭\nNew comedy content coming your way!\nLaughs guaranteed! 😂",
            "🔥 *Trending Now* 🔥\nCheck out what's hot in music and entertainment!\nDon't miss out!",
            "📢 *Channel Update* 📢\nWe're constantly adding new content!\nStay connected for daily surprises!",
            "🎉 *Special Content* 🎉\nExclusive music and comedy drops!\nYour daily dose of entertainment!",
            "🌟 *Premium Content* 🌟\nCurated music and entertainment!\nQuality content delivered daily!",
            "🚀 *New Releases* 🚀\nFresh music and comedy content!\nUpdated regularly for you!",
            "💫 *Entertainment Hub* 💫\nYour one-stop for music and fun!\nDaily updates guaranteed!"
        ];
        
        this.ensureDownloadDir();
    }

    ensureDownloadDir() {
        ensureDownloadDir();
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 Starting Channel Manager...');

        this.setupConnectionHandler();
        this.setupMessageHandlers();

        console.log('✅ Channel Manager started successfully!');
    }

    setupConnectionHandler() {
        this.sock.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
                console.log('✅ WhatsApp connected - starting scheduled tasks');
                this.socketReady = true;
                this.startScheduledTasks();
                this.sendChannelTestMessages();
                this.broadcastChannelsToGroups();
            } else if (update.connection === 'close') {
                console.log('❌ WhatsApp disconnected - pausing tasks');
                this.socketReady = false;
            }
        });
    }

    async sendChannelTestMessages() {
        if (!this.socketReady) {
            console.log('❌ Socket not ready for channel messages');
            return;
        }

        console.log('📢 Sending test messages to channels...');
        
        const testMessage = `🤖 *BOT CONNECTION TEST*\n\n` +
                           `✅ *WhatsBixby Bot is Now Connected!*\n\n` +
                           `🕒 *Connection Time:* ${new Date().toLocaleString()}\n` +
                           `📡 *Status:* Successfully connected to WhatsApp\n` +
                           `🎵 *Music Channel:* Ready for scheduled content\n` +
                           `🎭 *Entertainment Channel:* Ready for daily updates\n\n` +
                           `⏰ *Update Frequency:* Every 2 minutes\n` +
                           `📢 *Auto-broadcasting in all groups*`;

        try {
            await this.sock.sendMessage(this.channels.music, { 
                text: testMessage + `\n\n🎵 Music channel activated successfully!` 
            });
            console.log('✅ Test message sent to Music Channel');
            
            await this.delay(2000);
            
            await this.sock.sendMessage(this.channels.entertainment, { 
                text: testMessage + `\n\n🎭 Entertainment channel activated successfully!` 
            });
            console.log('✅ Test message sent to Entertainment Channel');
            
        } catch (error) {
            console.log('❌ Failed to send test messages to channels:', error.message);
        }
    }

    async broadcastChannelsToGroups() {
        if (!this.socketReady) {
            console.log('❌ Socket not ready for broadcasting');
            return;
        }

        console.log('📢 Broadcasting channel links to all groups...');
        
        const broadcastMessage = `🎉 *JOIN OUR CHANNELS* 🎉\n\n` +
                                `📱 *Stay Updated with Daily Content!*\n\n` +
                                `🎵 *MUSIC CHANNEL:*\n${this.channelLinks.music}\n` +
                                `• Fresh music daily\n` +
                                `• Trending tracks\n` +
                                `• Music updates every 2 minutes\n\n` +
                                `🎭 *ENTERTAINMENT CHANNEL:*\n${this.channelLinks.entertainment}\n` +
                                `• Comedy content\n` +
                                `• Memes & entertainment\n` +
                                `• Updates every 2 minutes\n\n` +
                                `🔥 *Follow both channels for the best experience!*`;

        const groups = Array.from(this.joinedGroups);
        let successCount = 0;

        for (const groupJid of groups) {
            try {
                await this.sock.sendMessage(groupJid, { text: broadcastMessage });
                successCount++;
                console.log(`✅ Channel broadcast sent to group: ${groupJid}`);
                await this.delay(1000);
            } catch (error) {
                console.log(`❌ Failed to broadcast to group: ${groupJid}`);
            }
        }

        console.log(`✅ Channel links broadcasted to ${successCount}/${groups.length} groups`);
    }

    async sendChannelMessage() {
        if (!this.socketReady) {
            console.log('❌ Socket not ready for channel message');
            return;
        }

        const randomMessage = this.channelMessages[Math.floor(Math.random() * this.channelMessages.length)];
        const timestamp = new Date().toLocaleTimeString();

        try {
            await this.sock.sendMessage(this.channels.music, { 
                text: `${randomMessage}\n\n⏰ ${timestamp}\n🎵 Music Channel` 
            });
            
            await this.delay(2000);
            
            await this.sock.sendMessage(this.channels.entertainment, { 
                text: `${randomMessage}\n\n⏰ ${timestamp}\n🎭 Entertainment Channel` 
            });
            
            console.log(`✅ Channel messages sent at ${timestamp}`);
        } catch (error) {
            console.log('❌ Failed to send channel messages:', error.message);
        }
    }

    stop() {
        this.isRunning = false;
        this.scheduler.stopAll();
        console.log('🛑 Channel Manager stopped');
    }

    setupMessageHandlers() {
        this.broadcastManager.setupHandlers(this.joinedGroups);
        
        this.sock.ev.on('group-participants.update', async (update) => {
            if (update.action === 'add' && update.participants.includes(this.sock.user.id)) {
                this.joinedGroups.add(update.id);
                console.log(`✅ Bot added to group: ${update.id}`);
                await this.sendWelcomeMessage(update.id);
            }
        });

        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message) return;

            const text = message.message.conversation || 
                         message.message.extendedTextMessage?.text || '';
            const from = message.key.remoteJid;

            console.log(`📩 Received message from ${from}: ${text}`);

            if (text.includes('chat.whatsapp.com/')) {
                await this.handleGroupLink(text, from);
            }

            if (text === '.testchannels') {
                await this.sendChannelTestMessages();
            }

            if (text === '.broadcastchannels') {
                await this.broadcastChannelsToGroups();
            }
        });
    }

    async sendWelcomeMessage(groupJid) {
        const welcomeMsg = `🤖 *Welcome to WhatsBixby!*\n\n` +
                          `I'll be sharing daily entertainment & music updates every 2 minutes!\n\n` +
                          `🎵 *Music Channel:* ${this.channelLinks.music}\n` +
                          `🎭 *Entertainment Channel:* ${this.channelLinks.entertainment}\n\n` +
                          `⏰ *Updates every 2 minutes*\n` +
                          `📱 *Auto-joins group links*`;

        await this.sock.sendMessage(groupJid, { text: welcomeMsg });
    }

    async handleGroupLink(link, fromJid) {
        try {
            const groupCode = this.extractGroupCode(link);
            if (!groupCode) return;

            const result = await this.sock.groupAcceptInvite(groupCode);
            if (result) {
                await this.sock.sendMessage(fromJid, { text: '✅ Joined group successfully!' });
            }
        } catch (error) {
            await this.sock.sendMessage(fromJid, { text: '❌ Failed to join group' });
        }
    }

    extractGroupCode(link) {
        const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }

    startScheduledTasks() {
        console.log('📅 Starting scheduled tasks...');
        
        this.scheduler.scheduleInterval(() => {
            if (this.socketReady) this.sendChannelMessage();
        }, 2 * 60 * 1000);

        this.scheduler.scheduleDailyTask(6, 0, () => {
            if (this.socketReady) this.musicManager.updateMusicSchedule();
        });
        
        this.scheduler.scheduleDailyTask(12, 0, () => {
            if (this.socketReady) this.musicManager.updateMusicSchedule();
        });
        
        this.scheduler.scheduleDailyTask(18, 0, () => {
            if (this.socketReady) this.musicManager.updateMusicSchedule();
        });
        
        this.scheduler.scheduleDailyTask(21, 0, () => {
            if (this.socketReady) this.musicManager.postChartToppers();
        });

        this.scheduler.scheduleDailyTask(12, 30, () => {
            if (this.socketReady) this.comedyManager.postComedianContent('lunch');
        });
        
        this.scheduler.scheduleDailyTask(16, 0, () => {
            if (this.socketReady) this.comedyManager.postComedianContent('break');
        });
        
        this.scheduler.scheduleDailyTask(20, 0, () => {
            if (this.socketReady) this.comedyManager.postComedianContent('night');
        });

        this.scheduler.scheduleInterval(() => {
            if (this.socketReady) this.comedyManager.sendMemes();
        }, 2 * 60 * 60 * 1000);

        this.scheduler.scheduleInterval(() => {
            if (this.socketReady) this.comedyManager.sendHypingQuote();
        }, 30 * 60 * 1000);

        console.log('✅ All tasks scheduled (2-minute channel updates enabled)');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            socketReady: this.socketReady,
            channels: Object.keys(this.channels),
            joinedGroups: this.joinedGroups.size,
            messageCount: this.channelMessages.length
        };
    }
}

module.exports = GroupManager;
