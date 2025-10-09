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

        console.log('✅ Channel Manager started successfully!');
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

    getStats() {
        return {
            isRunning: this.isRunning,
            channels: Object.keys(this.channels),
            ...this.scheduler.getStats(),
            music: this.musicManager.getStats(),
            comedy: this.comedyManager.getStats()
        };
    }
}

module.exports = GroupManager;