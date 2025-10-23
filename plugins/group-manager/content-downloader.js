const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const { cleanupFile } = require('./utils');

const SAFETY_MODE = false;

class ContentDownloader {
    constructor() {
        this.downloadDir = path.join(__dirname, '..', '..', 'downloads');
        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }
    }

    async searchYouTube(query, type = 'video') {
        if (SAFETY_MODE) {
            console.log(`🔍 SEARCH SAFETY LOCKED: ${query}`);
            throw new Error('Search functionality disabled for safety. Remove SAFETY_MODE flag to enable.');
        }

        try {
            console.log(`🔍 Searching YouTube for: ${query}`);
            const searchResults = await ytSearch(query);
            
            if (!searchResults.videos.length) {
                console.log('❌ No videos found');
                return null;
            }

            const filteredVideos = searchResults.videos.filter(video => 
                !video.live && video.seconds < 600 && video.seconds > 30
            );

            if (!filteredVideos.length) {
                console.log('❌ No suitable videos found after filtering');
                return null;
            }

            const randomIndex = Math.floor(Math.random() * Math.min(5, filteredVideos.length));
            const video = filteredVideos[randomIndex];
            
            console.log(`✅ Found: ${video.title} (${Math.round(video.seconds/60)}min)`);
            return video.url;
        } catch (error) {
            console.log('❌ YouTube search error:', error.message);
            return null;
        }
    }

    async downloadYouTubeAudio(videoUrl) {
        if (SAFETY_MODE) {
            console.log(`📥 DOWNLOAD SAFETY LOCKED: ${videoUrl}`);
            throw new Error('Download functionality disabled for safety. Remove SAFETY_MODE flag to enable.');
        }

        try {
            if (!ytdl.validateURL(videoUrl)) {
                console.log('❌ Invalid YouTube URL');
                return null;
            }

            const info = await ytdl.getInfo(videoUrl);
            const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            const filename = `audio_${title}_${Date.now()}.mp3`;
            const filepath = path.join(this.downloadDir, filename);

            console.log(`⬇️ Downloading audio: ${info.videoDetails.title}`);

            return new Promise((resolve, reject) => {
                const stream = ytdl(videoUrl, { 
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25
                }).pipe(fs.createWriteStream(filepath));

                stream.on('finish', () => {
                    console.log(`✅ Audio downloaded: ${filename}`);
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    console.log('❌ Audio download error:', error.message);
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                    }
                    reject(null);
                });
                
                setTimeout(() => {
                    if (fs.existsSync(filepath) && fs.statSync(filepath).size === 0) {
                        stream.destroy();
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath);
                        }
                        reject(null);
                    }
                }, 30000);
            });
        } catch (error) {
            console.log('❌ YouTube audio download error:', error.message);
            return null;
        }
    }

    async downloadYouTubeVideo(videoUrl) {
        if (SAFETY_MODE) {
            console.log(`🎬 VIDEO DOWNLOAD SAFETY LOCKED: ${videoUrl}`);
            throw new Error('Video download functionality disabled for safety. Remove SAFETY_MODE flag to enable.');
        }

        try {
            if (!ytdl.validateURL(videoUrl)) {
                console.log('❌ Invalid YouTube URL');
                return null;
            }

            const info = await ytdl.getInfo(videoUrl);
            const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            const filename = `video_${title}_${Date.now()}.mp4`;
            const filepath = path.join(this.downloadDir, filename);

            console.log(`⬇️ Downloading video: ${info.videoDetails.title}`);

            return new Promise((resolve, reject) => {
                const stream = ytdl(videoUrl, { 
                    quality: 'lowest',
                    filter: format => format.container === 'mp4' && format.hasVideo,
                    highWaterMark: 1 << 25
                }).pipe(fs.createWriteStream(filepath));

                stream.on('finish', () => {
                    console.log(`✅ Video downloaded: ${filename}`);
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    console.log('❌ Video download error:', error.message);
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                    }
                    reject(null);
                });
                
                setTimeout(() => {
                    if (fs.existsSync(filepath) && fs.statSync(filepath).size === 0) {
                        stream.destroy();
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath);
                        }
                        reject(null);
                    }
                }, 45000);
            });
        } catch (error) {
            console.log('❌ YouTube video download error:', error.message);
            return null;
        }
    }

    async downloadMusicByGenre(genre, queries) {
        if (SAFETY_MODE) {
            console.log(`🎵 MUSIC GENRE SAFETY LOCKED: ${genre}`);
            throw new Error('Music download functionality disabled for safety. Remove SAFETY_MODE flag to enable.');
        }

        try {
            const query = queries[Math.floor(Math.random() * queries.length)];
            console.log(`🎵 Downloading ${genre} music: ${query}`);
            const youtubeUrl = await this.searchYouTube(query);
            
            if (youtubeUrl) {
                return await this.downloadYouTubeAudio(youtubeUrl);
            }
            return null;
        } catch (error) {
            console.log(`❌ ${genre} music download error:`, error.message);
            return null;
        }
    }

    async downloadMusicByQuery(query) {
        if (SAFETY_MODE) {
            console.log(`🎵 MUSIC QUERY SAFETY LOCKED: ${query}`);
            throw new Error('Music download functionality disabled for safety. Remove SAFETY_MODE flag to enable.');
        }

        try {
            console.log(`🎵 Downloading music: ${query}`);
            const youtubeUrl = await this.searchYouTube(query);
            
            if (youtubeUrl) {
                return await this.downloadYouTubeAudio(youtubeUrl);
            }
            return null;
        } catch (error) {
            console.log(`❌ Music download error for "${query}":`, error.message);
            return null;
        }
    }

    async downloadComedyContent(query) {
        if (SAFETY_MODE) {
            console.log(`🎭 COMEDY DOWNLOAD SAFETY LOCKED: ${query}`);
            throw new Error('Comedy content download functionality disabled for safety. Remove SAFETY_MODE flag to enable.');
        }

        try {
            console.log(`🎭 Downloading comedy content: ${query}`);
            const youtubeUrl = await this.searchYouTube(query);
            
            if (youtubeUrl) {
                return await this.downloadYouTubeVideo(youtubeUrl);
            }
            return null;
        } catch (error) {
            console.log(`❌ Comedy content download error:`, error.message);
            return null;
        }
    }

    // Safety mode getter
    getSafetyStatus() {
        return {
            safetyMode: SAFETY_MODE,
            status: SAFETY_MODE ? 'LOCKED 🔒' : 'UNLOCKED ✅',
            message: SAFETY_MODE ? 'All downloads disabled for safety' : 'Downloads enabled'
        };
    }

    // Test method that works in safety mode
    async testDownload() {
        if (SAFETY_MODE) {
            return {
                success: false,
                message: '🔒 SAFETY MODE ACTIVE - Downloads disabled',
                instructions: 'Set SAFETY_MODE = false to enable downloading'
            };
        }
        
        return {
            success: true,
            message: '✅ Download system ready',
            status: 'UNLOCKED'
        };
    }

    cleanupOldFiles(maxAgeHours = 24) {
        try {
            const files = fs.readdirSync(this.downloadDir);
            const now = Date.now();
            const maxAge = maxAgeHours * 60 * 60 * 1000;
            
            let cleanedCount = 0;
            files.forEach(file => {
                const filepath = path.join(this.downloadDir, file);
                const stats = fs.statSync(filepath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filepath);
                    cleanedCount++;
                    console.log(`🧹 Cleaned up old file: ${file}`);
                }
            });
            
            if (cleanedCount > 0) {
                console.log(`✅ Cleaned up ${cleanedCount} old files`);
            }
        } catch (error) {
            console.log('❌ Cleanup error:', error.message);
        }
    }

    getDownloadStats() {
        try {
            const files = fs.readdirSync(this.downloadDir);
            const totalSize = files.reduce((total, file) => {
                const filepath = path.join(this.downloadDir, file);
                return total + (fs.existsSync(filepath) ? fs.statSync(filepath).size : 0);
            }, 0);
            
            return {
                fileCount: files.length,
                totalSize: Math.round(totalSize / 1024 / 1024) + 'MB',
                directory: this.downloadDir,
                safetyMode: SAFETY_MODE
            };
        } catch (error) {
            return { 
                fileCount: 0, 
                totalSize: '0MB', 
                directory: this.downloadDir,
                safetyMode: SAFETY_MODE
            };
        }
    }
}

module.exports = ContentDownloader;