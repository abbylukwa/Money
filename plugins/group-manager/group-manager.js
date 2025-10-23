const cron = require('node-cron');

class GroupManager {
    constructor(sock, joinedGroups) {
        this.sock = sock;
        this.joinedGroups = joinedGroups;
        this.isRunning = false;
        this.socketReady = false;
        
        this.channels = {
            music: '0029VbBn8li3LdQQcJbvwm2S@g.us',
            entertainment: '0029Vb6GzqcId7nWURAdJv0M@g.us'
        };
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        this.setupConnectionHandler();
        this.setupMessageHandlers();
        this.startContentScheduler();
        this.startRandomBroadcasts();
        
        console.log('✅ Abners Content Manager 2025 Started');
    }

    setupConnectionHandler() {
        this.sock.ev.on('connection.update', (update) => {
            if (update.connection === 'open') {
                console.log('✅ WhatsApp ready for content posting');
                this.socketReady = true;
                this.sendStartupMessages();
            } else if (update.connection === 'close') {
                this.socketReady = false;
            }
        });
    }

    async sendStartupMessages() {
        const startupMsg = `🤖 *ABNERS BOT 2025 STARTED* 🤖\n\n` +
                          `✅ Content Scheduler: ACTIVE\n` +
                          `🎵 Music Channel: READY\n` +
                          `🎭 Comedy Channel: READY\n` +
                          `📰 News System: READY\n` +
                          `📅 Year: 2025 Edition\n\n` +
                          `💳 EcoCash: 0777627210\n` +
                          `📱 Telkom: 0614159817\n` +
                          `🔑 Activation: Pretty911`;

        try {
            if (this.channels.music) {
                await this.sock.sendMessage(this.channels.music, { text: startupMsg });
            }
            if (this.channels.entertainment) {
                await this.sock.sendMessage(this.channels.entertainment, { text: startupMsg });
            }
        } catch (error) {
            console.log('Channel message failed - may need re-invite');
        }
    }

    startRandomBroadcasts() {
        console.log('📢 Starting random daily broadcasts...');
        
        // Random broadcasts 2-3 times daily at random times
        cron.schedule('0 10,15,20 * * *', () => {
            this.sendRandomBroadcast();
        });
    }

    async sendRandomBroadcast() {
        if (!this.socketReady || this.joinedGroups.size === 0) return;
        
        const broadcastMessages = [
            `🌟 *ABNERS BOT 2025 UPDATE* 🌟\n\nFresh content available!\nMusic • Comedy • News • Entertainment\n\n🔑 Activate: Pretty911\n💳 Pay: 0777627210 / 0614159817`,

            `🎉 *DAILY CONTENT DROP 2025* 🎉\n\nNew music, videos & comedy!\nUse .search to find content\n\n📅 2025 Exclusive Content\n🔑 Code: Pretty911`,

            `🔥 *TRENDING NOW 2025* 🔥\n\nLatest music & entertainment!\nSubscribe for unlimited access\n\n💸 EcoCash: 0777627210\n📱 Telkom: 0614159817`,

            `🚀 *PREMIUM ACCESS 2025* 🚀\n\nExclusive content available now!\nActivate with: Pretty911\n\n📞 Support: 0777627210`,

            `🎵 *MUSIC UPDATES 2025* 🎵\n\nFresh tracks every day!\nComedy • News • Entertainment\n\n🔑 Activation: Pretty911\n💳 Payments: 0777627210`
        ];

        const randomMessage = broadcastMessages[Math.floor(Math.random() * broadcastMessages.length)];
        let successCount = 0;

        for (const groupJid of this.joinedGroups) {
            try {
                await this.sock.sendMessage(groupJid, { text: randomMessage });
                successCount++;
                await this.delay(1500);
            } catch (error) {
                console.log(`❌ Failed to broadcast to group: ${groupJid}`);
            }
        }

        console.log(`✅ Random broadcast sent to ${successCount} groups`);
    }

    startContentScheduler() {
        console.log('⏰ Starting 2025 content scheduler...');

        // Music genres every 3 hours (6AM, 9AM, 12PM, 3PM, 6PM, 9PM)
        cron.schedule('0 6,9,12,15,18,21 * * *', () => {
            this.postMusicByTime();
        });

        // Comedy posts at lunch (12PM), break (4PM), night (8PM)
        cron.schedule('0 12,16,20 * * *', () => {
            this.postComedyContent();
        });

        // News from 7PM to 10PM
        cron.schedule('0 19,20,21 * * *', () => {
            this.postNews();
        });

        // Hyping quotes every 30 minutes
        cron.schedule('*/30 * * * *', () => {
            this.postMotivationalQuote();
        });

        // Saturday shows at 2PM, 4PM, 6PM
        cron.schedule('0 14,16,18 * * 6', () => {
            this.postSaturdayShow();
        });

        // Chart toppers at 9PM daily
        cron.schedule('0 21 * * *', () => {
            this.postChartToppers();
        });

        console.log('✅ All 2025 content schedules active');
    }

    async postMusicByTime() {
        if (!this.socketReady) return;
        
        const now = new Date('2025-01-01');
        const hour = new Date().getHours();
        const day = new Date().getDay();
        const genres = this.getCurrentGenre(day, hour);
        
        const musicMsg = `🎵 *NOW PLAYING 2025* 🎵\n\n` +
                        `⏰ Time: ${hour}:00\n` +
                        `🎶 Genre: ${genres.join(', ')}\n` +
                        `📅 Day: ${this.getDayName(day)}\n` +
                        `📅 Year: 2025 Edition\n\n` +
                        `🎧 Streaming latest music...\n` +
                        `💳 EcoCash: 0777627210\n` +
                        `🔑 Activation: Pretty911`;

        try {
            if (this.channels.music) {
                await this.sock.sendMessage(this.channels.music, { text: musicMsg });
                console.log(`✅ 2025 Music posted for ${hour}:00 - ${genres[0]}`);
            }
        } catch (error) {
            console.log('Music post failed');
        }
    }

    async postComedyContent() {
        if (!this.socketReady) return;
        
        const zimComedians = ['Carl Joshua Ncube', 'Doc Vikela', 'Long John', 'Clive Chigubu', 'Q Dube', 'Mai Titi', 'Madam Boss', 'Comic Pastor', 'King Kandoro', 'Bhutisi'];
        const saComedians = ['Trevor Noah', 'Loyiso Gola', 'Skhumba Hlophe', 'Tumi Morake', 'David Kau', 'Riaad Moosa', 'Kagiso Lediga', 'Celeste Ntuli', 'Nik Rabinowitz', 'Marc Lottering'];
        
        const zimComedian = zimComedians[Math.floor(Math.random() * zimComedians.length)];
        const saComedian = saComedians[Math.floor(Math.random() * saComedians.length)];

        const comedyMsg = `🎭 *DAILY COMEDY 2025* 🎭\n\n` +
                         `🇿🇼 *Zimbabwe:* ${zimComedian}\n` +
                         `🇿🇦 *South Africa:* ${saComedian}\n` +
                         `📅 Year: 2025 Content\n\n` +
                         `😂 Fresh comedy updates\n` +
                         `📱 Download via .search\n\n` +
                         `💳 EcoCash: 0777627210\n` +
                         `🔑 Code: Pretty911`;

        try {
            if (this.channels.entertainment) {
                await this.sock.sendMessage(this.channels.entertainment, { text: comedyMsg });
                console.log(`✅ 2025 Comedy posted: ${zimComedian} & ${saComedian}`);
            }
        } catch (error) {
            console.log('Comedy post failed');
        }
    }

    async postNews() {
        if (!this.socketReady) return;
        
        const newsOutlets = ['BBC News Africa', 'Al Jazeera English', 'SABC News', 'NTV Kenya', 'Channels Television', 'eNCA', 'Africanews'];
        const outlet = newsOutlets[Math.floor(Math.random() * newsOutlets.length)];

        const newsMsg = `📰 *EVENING NEWS 2025* 📰\n\n` +
                       `🌍 Source: ${outlet}\n` +
                       `🕒 Time: ${new Date().getHours()}:00\n` +
                       `📅 Year: 2025 Updates\n\n` +
                       `📡 Latest African news\n` +
                       `🔗 Full stories via .search\n\n` +
                       `💳 EcoCash: 0777627210\n` +
                       `🔑 Activation: Pretty911`;

        try {
            if (this.channels.entertainment) {
                await this.sock.sendMessage(this.channels.entertainment, { text: newsMsg });
                console.log(`✅ 2025 News posted: ${outlet}`);
            }
        } catch (error) {
            console.log('News post failed');
        }
    }

    async postMotivationalQuote() {
        if (!this.socketReady) return;
        
        const quotes = [
            "🔥 2025 Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "💪 2025 Your limitation—it's only your imagination.",
            "🚀 2025 Push yourself, because no one else is going to do it for you.",
            "🌟 2025 Great things never come from comfort zones.",
            "🎯 2025 The harder you work for something, the greater you'll feel when you achieve it.",
            "💫 2025 Don't stop when you're tired. Stop when you're done.",
            "🔥 2025 Wake up with determination. Go to bed with satisfaction."
        ];

        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        
        const quoteMsg = `💫 *2025 MOTIVATION* 💫\n\n` +
                        `${quote}\n\n` +
                        `✨ 2025 Keep pushing! ✨\n` +
                        `💳 Support: 0777627210\n` +
                        `🔑 Code: Pretty911`;

        try {
            if (this.channels.entertainment) {
                await this.sock.sendMessage(this.channels.entertainment, { text: quoteMsg });
                console.log('✅ 2025 Motivational quote posted');
            }
        } catch (error) {
            console.log('Quote post failed');
        }
    }

    async postSaturdayShow() {
        if (!this.socketReady) return;
        
        const shows = ['Wild N Out', 'Americas Got Talent', 'The Masked Singer', 'Lip Sync Battle', 'So You Think You Can Dance', 'World of Dance', 'The Voice'];
        const show = shows[Math.floor(Math.random() * shows.length)];

        const showMsg = `🎬 *SATURDAY SHOW 2025* 🎬\n\n` +
                       `📺 ${show}\n` +
                       `🎉 2025 Weekend Entertainment\n\n` +
                       `🍿 Full episodes via .search\n` +
                       `💳 EcoCash: 0777627210\n` +
                       `🔑 Activation: Pretty911`;

        try {
            if (this.channels.entertainment) {
                await this.sock.sendMessage(this.channels.entertainment, { text: showMsg });
                console.log(`✅ 2025 Saturday show posted: ${show}`);
            }
        } catch (error) {
            console.log('Show post failed');
        }
    }

    async postChartToppers() {
        if (!this.socketReady) return;
        
        const charts = ['Billboard', 'Spotify Charts', 'Apple Music Top 100', 'Shazam Global Top 200', 'YouTube Music Trending'];
        const chart = charts[Math.floor(Math.random() * charts.length)];

        const chartMsg = `🏆 *2025 CHART TOPPERS* 🏆\n\n` +
                        `📊 ${chart}\n` +
                        `⭐ 2025 Biggest Hits\n\n` +
                        `🎧 Download via .search\n` +
                        `💳 EcoCash: 0777627210\n` +
                        `🔑 Code: Pretty911`;

        try {
            if (this.channels.music) {
                await this.sock.sendMessage(this.channels.music, { text: chartMsg });
                console.log(`✅ 2025 Chart toppers posted: ${chart}`);
            }
        } catch (error) {
            console.log('Chart post failed');
        }
    }

    getCurrentGenre(day, hour) {
        const schedule = {
            0: { 6: ['Worship'], 9: ['Soft Rock'], 12: ['Instrumentals'], 15: ['Jazz'], 18: ['Soul/Neo-Soul'], 21: ['Soul/Neo-Soul'] },
            1: { 6: ['Acoustic'], 9: ['Pop'], 12: ['Afrobeat'], 15: ['R&B/Soul'], 18: ['Chill/Lo-fi'], 21: ['Chill/Lo-fi'] },
            2: { 6: ['Jazz'], 9: ['Dancehall'], 12: ['Amapiano'], 15: ['Hip-Hop'], 18: ['Classical'], 21: ['Classical'] },
            3: { 6: ['Gospel'], 9: ['Country'], 12: ['Pop'], 15: ['Trap'], 18: ['Afro-soul'], 21: ['Afro-soul'] },
            4: { 6: ['Lo-fi'], 9: ['K-Pop'], 12: ['Afrobeat'], 15: ['EDM'], 18: ['R&B'], 21: ['R&B'] },
            5: { 6: ['House'], 9: ['Hip-Hop'], 12: ['Reggae'], 15: ['Amapiano'], 18: ['Party Mix'], 21: ['Party Mix'] },
            6: { 6: ['Chillhop'], 9: ['Afro-fusion'], 12: ['ZimDancehall'], 15: ['Gqom'], 18: ['Dance/Electronic'], 21: ['Dance/Electronic'] }
        };

        return schedule[day]?.[hour] || ['2025 Mixed Selection'];
    }

    getDayName(day) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[day];
    }

    setupMessageHandlers() {
        this.sock.ev.on('group-participants.update', async (update) => {
            if (update.action === 'add' && update.participants.includes(this.sock.user.id)) {
                this.joinedGroups.add(update.id);
                await this.sendWelcomeMessage(update.id);
            }
        });

        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message) return;

            const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
            const from = message.key.remoteJid;

            if (text.includes('chat.whatsapp.com/')) {
                await this.handleGroupLink(text, from);
            }
        });
    }

    async sendWelcomeMessage(groupJid) {
        const welcomeMsg = `🤖 *WELCOME TO ABNERS BOT 2025!* 🤖\n\n` +
                          `🎵 2025 Music Updates\n` +
                          `🎭 Comedy & Entertainment\n` +
                          `📰 News & Motivation\n` +
                          `📅 Year: 2025 Edition\n\n` +
                          `💳 *EcoCash:* 0777627210\n` +
                          `📱 *Telkom:* 0614159817\n` +
                          `🔑 *Activation:* Pretty911\n\n` +
                          `📋 Use *.help* for commands`;

        await this.sock.sendMessage(groupJid, { text: welcomeMsg });
    }

    async handleGroupLink(link, fromJid) {
        try {
            const groupCode = this.extractGroupCode(link);
            if (!groupCode) return;

            await this.sock.groupAcceptInvite(groupCode);
            await this.sock.sendMessage(fromJid, { text: '✅ Joined group! Use .help for commands\n💳 EcoCash: 0777627210\n🔑 Activation: Pretty911' });
        } catch (error) {
            await this.sock.sendMessage(fromJid, { text: '❌ Failed to join\n📞 Contact: 0777627210' });
        }
    }

    extractGroupCode(link) {
        const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = GroupManager;