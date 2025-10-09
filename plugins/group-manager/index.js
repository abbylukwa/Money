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

        // Wait for socket to be ready
        await this.waitForSocketReady();
        
        this.setupMessageHandlers();
        this.startScheduledTasks();
        
        // Send test message to channels
        await this.sendChannelTestMessages();

        console.log('✅ Channel Manager started successfully!');
    }

    async waitForSocketReady() {
        console.log('⏳ Checking socket readiness...');
        return new Promise((resolve) => {
            const checkReady = () => {
                if (this.sock.user && this.sock.user.id) {
                    console.log('✅ Socket ready for channel operations');
                    resolve();
                } else {
                    console.log('⏳ Waiting for socket...');
                    setTimeout(checkReady, 1000);
                }
            };
            checkReady();
        });
    }

    async sendChannelTestMessages() {
        console.log('📢 Sending test messages to channels...');
        
        // Check if socket is ready
        if (!this.sock.user || !this.sock.user.id) {
            console.log('❌ Socket not ready for channel messages');
            return;
        }

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
                text: testMessage + `\n\n🎵 Music channel activated successfully!` 
            });
            console.log('✅ Test message sent to Music Channel');
            
            // Add delay between messages
            await this.delay(3000);
            
            // Send to Entertainment Channel  
            await this.sock.sendMessage(this.channels.entertainment, { 
                text: testMessage + `\n\n🎭 Entertainment channel activated successfully!` 
            });
            console.log('✅ Test message sent to Entertainment Channel');
            
        } catch (error) {
            console.log('❌ Failed to send test messages to channels:', error.message);
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
            }
        });
    }

    startScheduledTasks() {
        // Start with a delay to ensure socket is ready
        setTimeout(() => {
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
        }, 5000); // 5 second delay
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            channels: Object.keys(this.channels),
            joinedGroups: this.joinedGroups.size,
            socketReady: !!(this.sock.user && this.sock.user.id)
        };
    }
}

module.exports = GroupManager;
