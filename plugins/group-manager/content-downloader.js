const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const { cleanupFile } = require('./utils');

class ContentDownloader {
    constructor() {
        this.downloadDir = path.join(__dirname, '..', '..', 'downloads');
        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }
    }

    async searchYouTube(query, type = 'video') {
        try {
            console.log(`🔍 Searching YouTube for: ${query}`);
            const searchResults = await ytSearch(query);
            
            if (!searchResults.videos.length) {
                console.log('❌ No videos found');
                return null;
            }

            const filteredVideos = searchResults.videos.filter(video => 
                !video.live && video.seconds < 3600
            );

            if (!filteredVideos.length) return null;

            const randomIndex = Math.floor(Math.random() * Math.min(5, filteredVideos.length));
            const video = filteredVideos[randomIndex];
            
            console.log(`✅ Found: ${video.title}`);
            return video.url;
        } catch (error) {
            console.log('❌ YouTube search error:', error);
            return null;
        }
    }

    async downloadYouTubeAudio(videoUrl) {
        try {
            if (!ytdl.validateURL(videoUrl)) {
                console.log('❌ Invalid YouTube URL');
                return null;
            }

            const info = await ytdl.getInfo(videoUrl);
            const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `audio_${title}_${Date.now()}.mp3`;
            const filepath = path.join(this.downloadDir, filename);

            console.log(`⬇️ Downloading audio: ${title}`);

            return new Promise((resolve, reject) => {
                const stream = ytdl(videoUrl, { 
                    filter: 'audioonly',
                    quality: 'highestaudio'
                }).pipe(fs.createWriteStream(filepath));

                stream.on('finish', () => {
                    console.log(`✅ Audio downloaded: ${filename}`);
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    console.log('❌ Audio download error:', error);
                    reject(null);
                });
            });
        } catch (error) {
            console.log('❌ YouTube audio download error:', error);
            return null;
        }
    }

    async downloadYouTubeVideo(videoUrl) {
        try {
            if (!ytdl.validateURL(videoUrl)) {
                console.log('❌ Invalid YouTube URL');
                return null;
            }

            const info = await ytdl.getInfo(videoUrl);
            const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `video_${title}_${Date.now()}.mp4`;
            const filepath = path.join(this.downloadDir, filename);

            console.log(`⬇️ Downloading video: ${title}`);

            return new Promise((resolve, reject) => {
                const stream = ytdl(videoUrl, { 
                    quality: 'lowest',
                    filter: format => format.container === 'mp4'
                }).pipe(fs.createWriteStream(filepath));

                stream.on('finish', () => {
                    console.log(`✅ Video downloaded: ${filename}`);
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    console.log('❌ Video download error:', error);
                    reject(null);
                });
            });
        } catch (error) {
            console.log('❌ YouTube video download error:', error);
            return null;
        }
    }

    async downloadMusicByGenre(genre, queries) {
        const query = queries[Math.floor(Math.random() * queries.length)];
        const youtubeUrl = await this.searchYouTube(query);
        
        if (youtubeUrl) {
            return await this.downloadYouTubeAudio(youtubeUrl);
        }
        return null;
    }

    async downloadMusicByQuery(query) {
        const youtubeUrl = await this.searchYouTube(query);
        
        if (youtubeUrl) {
            return await this.downloadYouTubeAudio(youtubeUrl);
        }
        return null;
    }

    async downloadComedyContent(query) {
        const youtubeUrl = await this.searchYouTube(query);
        
        if (youtubeUrl) {
            return await this.downloadYouTubeVideo(youtubeUrl);
        }
        return null;
    }
}

module.exports = ContentDownloader;