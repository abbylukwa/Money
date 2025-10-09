const ContentDownloader = require('./content-downloader');
const fs = require('fs');

class MusicManager {
    constructor(sock, channels) {
        this.sock = sock;
        this.channels = channels;
        this.downloader = new ContentDownloader();
        
        this.musicSchedule = {
            'Monday': [
                ['06:00-09:00', 'Acoustic'],
                ['09:00-12:00', 'Pop'],
                ['12:00-15:00', 'Afrobeat'],
                ['15:00-18:00', 'R&B/Soul'],
                ['18:00-22:00', 'Chill/Lo-fi']
            ],
            'Tuesday': [
                ['06:00-09:00', 'Jazz'],
                ['09:00-12:00', 'Dancehall'],
                ['12:00-15:00', 'Amapiano'],
                ['15:00-18:00', 'Hip-Hop'],
                ['18:00-22:00', 'Classical']
            ],
            'Wednesday': [
                ['06:00-09:00', 'Gospel'],
                ['09:00-12:00', 'Country'],
                ['12:00-15:00', 'Pop'],
                ['15:00-18:00', 'Trap'],
                ['18:00-22:00', 'Afro-soul']
            ],
            'Thursday': [
                ['06:00-09:00', 'Lo-fi'],
                ['09:00-12:00', 'K-Pop'],
                ['12:00-15:00', 'Afrobeat'],
                ['15:00-18:00', 'EDM'],
                ['18:00-22:00', 'R&B']
            ],
            'Friday': [
                ['06:00-09:00', 'House'],
                ['09:00-12:00', 'Hip-Hop'],
                ['12:00-15:00', 'Reggae'],
                ['15:00-18:00', 'Amapiano'],
                ['18:00-22:00', 'Party Mix']
            ],
            'Saturday': [
                ['06:00-09:00', 'Chillhop'],
                ['09:00-12:00', 'Afro-fusion'],
                ['12:00-15:00', 'ZimDancehall'],
                ['15:00-18:00', 'Gqom'],
                ['18:00-22:00', 'Dance/Electronic']
            ],
            'Sunday': [
                ['06:00-09:00', 'Worship'],
                ['09:00-12:00', 'Soft Rock'],
                ['12:00-15:00', 'Instrumentals'],
                ['15:00-18:00', 'Jazz'],
                ['18:00-22:00', 'Soul/Neo-Soul']
            ]
        };

        this.musicCharts = [
            'Billboard', 'Spotify Charts', 'Apple Music Top 100',
            'Shazam Global Top 200', 'YouTube Music Trending'
        ];

        this.contentQueries = {
            'Acoustic': ['acoustic cover 2024', 'acoustic songs', 'unplugged music'],
            'Pop': ['pop hits 2024', 'top 40 pop', 'billboard pop'],
            'Afrobeat': ['afrobeat 2024', 'burna boy', 'wizkid', 'davido'],
            'R&B/Soul': ['r&b 2024', 'soul music', 'rnb hits'],
            'Chill/Lo-fi': ['lofi hip hop', 'chill beats', 'study music'],
            'Jazz': ['jazz music', 'smooth jazz', 'jazz instrumental'],
            'Dancehall': ['dancehall 2024', 'shatta wale', 'stonebwoy'],
            'Amapiano': ['amapiano 2024', 'kabza de small', 'djmaphorisa'],
            'Hip-Hop': ['hip hop 2024', 'rap music', 'new rap'],
            'Classical': ['classical music', 'mozart', 'beethoven'],
            'Gospel': ['gospel music 2024', 'worship songs', 'christian music'],
            'Country': ['country music 2024', 'country hits', 'nashville'],
            'Trap': ['trap music 2024', 'trap beats', 'trap hiphop'],
            'Afro-soul': ['afro soul', 'soulful afro', 'afro r&b'],
            'K-Pop': ['kpop 2024', 'bts', 'blackpink'],
            'EDM': ['edm 2024', 'electronic dance', 'festival music'],
            'Reggae': ['reggae 2024', 'bob marley', 'reggae hits'],
            'Party Mix': ['party music', 'dance mix', 'club hits'],
            'Chillhop': ['chillhop', 'jazz hop', 'lofi jazz'],
            'Afro-fusion': ['afro fusion', 'afro pop', 'african fusion'],
            'ZimDancehall': ['zimbabwe dancehall', 'winky d', 'sniper storm'],
            'Gqom': ['gqom music', 'south african house', 'gqom beats'],
            'Dance/Electronic': ['dance music', 'electronic 2024', 'edm hits'],
            'Worship': ['worship music', 'hillsong', 'worship 2024'],
            'Soft Rock': ['soft rock', 'rock ballads', 'classic rock'],
            'Instrumentals': ['instrumental music', 'background music', 'no vocals'],
            'Soul/Neo-Soul': ['neo soul', 'soul music', 'erykah badu']
        };

        this.stats = {
            songsPlayed: 0,
            lastPlayed: null
        };
    }

    async updateMusicSchedule() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const schedule = this.musicSchedule[today];

        if (schedule) {
            const currentTime = new Date();
            const currentHour = currentTime.getHours();
            let currentGenre = '';

            for (const [timeRange, genre] of schedule) {
                const [start, end] = timeRange.split('-').map(t => parseInt(t.split(':')[0]));
                if (currentHour >= start && currentHour < end) {
                    currentGenre = genre;
                    break;
                }
            }

            const scheduleText = schedule.map(([time, genre]) => 
                `⏰ ${time} - ${genre}${genre === currentGenre ? ' 🎧 NOW PLAYING' : ''}`
            ).join('\n');

            const message = `🎵 *${today.toUpperCase()} MUSIC SCHEDULE* 🎵\n\n${scheduleText}\n\nEnjoy the music! 🎶`;
            await this.sendToMusicChannel(message);

            if (currentGenre) {
                await this.playGenreMusic(currentGenre);
            }
        }
    }

    async playGenreMusic(genre) {
        try {
            const audioPath = await this.downloader.downloadMusicByGenre(genre, this.contentQueries[genre]);
            if (audioPath) {
                await this.sendAudioToMusicChannel(audioPath, 
                    `🎵 ${genre} Track\nGenre: ${genre}\n\n*Copyright Disclaimer:* Content shared for entertainment only. All rights belong to the respective artists.`);
                
                this.stats.songsPlayed++;
                this.stats.lastPlayed = new Date().toISOString();
            }
        } catch (error) {
            console.log('❌ Music playback error:', error);
        }
    }

    async postChartToppers() {
        const chart = this.musicCharts[Math.floor(Math.random() * this.musicCharts.length)];
        const message = `🏆 *TONIGHT'S CHART TOPPERS* 🏆\n\nChart: *${chart}*\nHere are the hottest tracks right now! 🔥\n\n#Charts #${chart.replace(/\s+/g, '')}`;
        
        await this.sendToMusicChannel(message);
        await this.playChartMusic(chart);
    }

    async playChartMusic(chart) {
        try {
            const query = `${chart} top 10 2024`;
            const audioPath = await this.downloader.downloadMusicByQuery(query);
            if (audioPath) {
                await this.sendAudioToMusicChannel(audioPath,
                    `🏆 ${chart} Hit\nChart: ${chart}\n\n*Copyright Disclaimer:* Content shared for entertainment only. All rights belong to the respective artists.`);
            }
        } catch (error) {
            console.log('❌ Chart music error:', error);
        }
    }

    async sendToMusicChannel(message) {
        try {
            const musicChannelJid = this.channels.music;
            await this.sock.sendMessage(musicChannelJid, { text: message });
            console.log(`✅ Sent to music channel`);
        } catch (error) {
            console.log('❌ Error sending to music channel:', error);
        }
    }

    async sendAudioToMusicChannel(audioPath, caption) {
        try {
            const musicChannelJid = this.channels.music;
            if (fs.existsSync(audioPath)) {
                const audioBuffer = fs.readFileSync(audioPath);
                await this.sock.sendMessage(musicChannelJid, {
                    audio: audioBuffer,
                    caption: caption,
                    mimetype: 'audio/mp3',
                    ptt: false
                });
                console.log(`✅ Sent audio to music channel`);
            }
        } catch (error) {
            console.log('❌ Error sending audio:', error);
        }
    }

    getStats() {
        return this.stats;
    }
}

module.exports = MusicManager;