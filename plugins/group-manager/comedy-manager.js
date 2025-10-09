const ContentDownloader = require('./content-downloader');
const fs = require('fs');

class ComedyManager {
    constructor(sock, channels) {
        this.sock = sock;
        this.channels = channels;
        this.downloader = new ContentDownloader();
        
        this.zimComedians = [
            { name: 'Carl Joshua Ncube', youtube: '@carljoshuancube' },
            { name: 'Doc Vikela', youtube: '@docvikela' },
            { name: 'Long John', youtube: '@longjohn' },
            { name: 'Clive Chigubu', youtube: '@clivechigubu' },
            { name: 'Q Dube', youtube: '@qudube' },
            { name: 'Mai Titi', youtube: '@maititi' },
            { name: 'Madam Boss', youtube: '@madamboss' },
            { name: 'Comic Pastor', youtube: '@comicpastor' },
            { name: 'King Kandoro', youtube: '@kingkandoro' },
            { name: 'Bhutisi', youtube: '@bhutisi' }
        ];

        this.saComedians = [
            { name: 'Trevor Noah', youtube: '@trevornoah' },
            { name: 'Loyiso Gola', youtube: '@loyisogola' },
            { name: 'Skhumba Hlophe', youtube: '@skhumbahlophe' },
            { name: 'Tumi Morake', youtube: '@tumimorake' },
            { name: 'David Kau', youtube: '@davidkau' },
            { name: 'Riaad Moosa', youtube: '@riaadmoosa' },
            { name: 'Kagiso Lediga', youtube: '@kagisolediga' },
            { name: 'Celeste Ntuli', youtube: '@celestentuli' },
            { name: 'Nik Rabinowitz', youtube: '@nikrabinowitz' },
            { name: 'Marc Lottering', youtube: '@marclottering' }
        ];

        this.hypingQuotes = [
            "🔥 Stay focused and never give up! 🔥",
            "💪 Your potential is endless! Keep pushing! 💪",
            "🚀 Great things never come from comfort zones! 🚀",
            "🌟 Believe you can and you're halfway there! 🌟",
            "🎯 Success is walking from failure to failure with no loss of enthusiasm! 🎯"
        ];

        this.stats = {
            comedyPosts: 0,
            memesSent: 0,
            quotesSent: 0
        };
    }

    async postComedianContent(timeOfDay) {
        const zimComedian = this.zimComedians[Math.floor(Math.random() * this.zimComedians.length)];
        const saComedian = this.saComedians[Math.floor(Math.random() * this.saComedians.length)];

        const timeLabels = {
            'lunch': 'LUNCH BREAK COMEDY',
            'break': 'AFTERNOON COMEDY BREAK', 
            'night': 'EVENING COMEDY SPECIAL'
        };

        const message = `🎭 *${timeLabels[timeOfDay]}* 🎭\n\n` +
                       `🇿🇼 *Zimbabwean Comedian:* ${zimComedian.name}\n` +
                       `🇿🇦 *South African Comedian:* ${saComedian.name}\n\n` +
                       `*Credits:*\nYouTube: ${zimComedian.youtube} & ${saComedian.youtube}`;

        await this.sendToEntertainmentChannel(message);
        
        this.stats.comedyPosts++;
    }

    async sendMemes() {
        try {
            const queries = ['funny memes compilation', 'african memes', 'tiktok memes'];
            const query = queries[Math.floor(Math.random() * queries.length)];
            const videoPath = await this.downloader.downloadComedyContent(query);
            
            if (videoPath) {
                await this.sendVideoToEntertainmentChannel(videoPath,
                    `😂 Meme Compilation\n\n*Copyright Disclaimer:* Content shared for entertainment purposes only. All rights belong to the respective creators.`);
            }
        } catch (error) {
            console.log('❌ Meme content error:', error);
        }
        
        this.stats.memesSent++;
    }

    async sendHypingQuote() {
        const quote = this.hypingQuotes[Math.floor(Math.random() * this.hypingQuotes.length)];
        const message = `💫 *DAILY MOTIVATION* 💫\n\n${quote}\n\nKeep shining! ✨`;
        await this.sendToEntertainmentChannel(message);
        this.stats.quotesSent++;
    }

    async sendToEntertainmentChannel(message) {
        try {
            const entertainmentChannelJid = this.channels.entertainment;
            await this.sock.sendMessage(entertainmentChannelJid, { text: message });
            console.log(`✅ Sent to entertainment channel`);
        } catch (error) {
            console.log('❌ Error sending to entertainment channel:', error);
        }
    }

    async sendVideoToEntertainmentChannel(videoPath, caption) {
        try {
            const entertainmentChannelJid = this.channels.entertainment;
            if (fs.existsSync(videoPath)) {
                const videoBuffer = fs.readFileSync(videoPath);
                await this.sock.sendMessage(entertainmentChannelJid, {
                    video: videoBuffer,
                    caption: caption,
                    mimetype: 'video/mp4'
                });
                console.log(`✅ Sent video to entertainment channel`);
            }
        } catch (error) {
            console.log('❌ Error sending video:', error);
        }
    }

    getStats() {
        return this.stats;
    }
}

module.exports = ComedyManager;