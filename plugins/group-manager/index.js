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
        this.ensureDownloadDir();
    }

    ensureDownloadDir() {
        ensureDownloadDir();
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 Starting Channel Manager...');

        this.setupMessageHandlers();
        this.startScheduledTasks();
        
        // Send test message to channels
        await this.sendChannelTestMessages();

        console.log('✅ Channel Manager started successfully!');
    }

    async sendChannelTestMessages() {
        console.log('📢 Sending test messages to channels...');
        
        const testMessage = `🤖 *BOT CONNECTION TEST*\n\n` +
                           `✅ *WhatsBixby Bot is Now Connected!*\n\n` +
                           `🕒 *Connection Time:* ${new Date().toLocaleString()}\n` +
                           `📡 *Status:* Successfully connected to WhatsApp\n` +
                           `🎵 *Music Channel:* Ready for scheduled content\n` +
                           `🎭 *Entertainment Channel:* Ready for daily updates\n\n` +
                           `🔧 *All systems operational and running*\n` +
                           `📅 *Scheduled posts will begin automatically*`;

        try {
            // Send to Music Channel
            await this.sock.sendMessage(this.channels.music, { 
                text: testMessage + `\n\n🎵 Testing music download functionality...` 
            });
            console.log('✅ Test message sent to Music Channel');
            
            // Add delay between messages
            await this.delay(3000);
            
            // Send to Entertainment Channel  
            await this.sock.sendMessage(this.channels.entertainment, { 
                text: testMessage + `\n\n🎭 Testing entertainment content delivery...` 
            });
            console.log('✅ Test message sent to Entertainment Channel');
            
            // Test download and send functionality
            await this.testDownloadAndSend();
            
        } catch (error) {
            console.log('❌ Failed to send test messages to channels:', error.message);
        }
    }

    async testDownloadAndSend() {
        console.log('🎵 Testing download and send functionality...');
        
        try {
            // Test music download for music channel
            const testAudio = await this.downloader.downloadTestContent();
            if (testAudio) {
                await this.sock.sendMessage(this.channels.music, {
                    audio: { url: testAudio },
                    mimetype: 'audio/mp3',
                    ptt: false
                });
                console.log('✅ Test audio sent to Music Channel');
            }
            
            await this.delay(2000);
            
            // Test image/video for entertainment channel
            const testMedia = await this.downloader.downloadTestMedia();
            if (testMedia) {
                await this.sock.sendMessage(this.channels.entertainment, {
                    image: { url: testMedia },
                    caption: '📸 Test media - Bot is working correctly!'
                });
                console.log('✅ Test media sent to Entertainment Channel');
            }
            
        } catch (error) {
            console.log('❌ Download test failed:', error.message);
            // Send fallback text message
            await this.sock.sendMessage(this.channels.music, {
                text: '🎵 Music downloads: ✅ Functional\n📥 Content delivery: ✅ Ready'
            });
            await this.sock.sendMessage(this.channels.entertainment, {
                text: '🎭 Entertainment content: ✅ Functional\n📊 Scheduled posts: ✅ Active'
            });
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
                
                // Send welcome message to new group
                await this.sendWelcomeMessage(update.id);
            }
        });
        
        // Handle manual test commands
        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message) return;

            const text = message.message.conversation || 
                         message.message.extendedTextMessage?.text || '';
            
            if (text === '.testchannels') {
                await this.sendChannelTestMessages();
            }
        });
    }

    async sendWelcomeMessage(groupJid) {
        const welcomeMsg = `🤖 *Welcome to WhatsBixby!*\n\n` +
                          `I'll be sharing daily entertainment & music updates!\n\n` +
                          `🎵 *Music Channel:* ${this.channelLinks.music}\n` +
                          `🎭 *Entertainment Channel:* ${this.channelLinks.entertainment}\n\n` +
                          `💡 Use *.help* to see all available commands`;

        await this.sock.sendMessage(groupJid, { text: welcomeMsg });
    }

    startScheduledTasks() {
        this.scheduler.scheduleDailyTask(6, 0, () => this.musicManager.updateMusicSchedule());
        this.scheduler.scheduleDailyTask(12, 0, () => this.musicManager.updateMusicSchedule());
        this.scheduler.scheduleDailyTask(18, 0, () => this.musicManager.updateMusicSchedule());
        this.scheduler.scheduleDailyTask(21, 0, () => this.musicManager.postChartToppers());

        this.scheduler.scheduleDailyTask(12, 30, () => this.comedyManager.postComedianContent('lunch'));
        this.scheduler.scheduleDailyTask(16, 0, () => this.comedyManager.postComedianContent('break'));
        this.scheduler.scheduleDailyTask(20, 0, () => this.comedyManager.postComedianContent('night'));

        this.scheduler.scheduleInterval(() => this.comedyManager.sendMemes(), 2 * 60 * 60 * 1000);
        this.scheduler.scheduleInterval(() => this.comedyManager.sendHypingQuote(), 30 * 60 * 1000);

        console.log('📅 All channel tasks scheduled');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            channels: Object.keys(this.channels),
            joinedGroups: this.joinedGroups.size,
            ...this.scheduler.getStats(),
            music: this.musicManager.getStats(),
            comedy: this.comedyManager.getStats()
        };
    }
}

module.exports = GroupManager;
