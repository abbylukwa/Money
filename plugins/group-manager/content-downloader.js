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
        
        // Test content URLs (short, safe content)
        this.testContent = {
            audio: [
                'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Lofi girl - 24/7 stream
                'https://www.youtube.com/watch?v=5qap5aO4i9A', // Lofi hip hop
                'https://www.youtube.com/watch?v=kgx4WGK0oNU'  // Chill beats
            ],
            video: [
                'https://www.youtube.com/watch?v=W0LHTWGNUmY', // Relaxing nature
                'https://www.youtube.com/watch?v=9Auq9mYxFEE', // Beautiful scenery
                'https://www.youtube.com/watch?v=YOUR_TEST_VIDEO' // Replace with your test video
            ]
        };
    }

    async searchYouTube(query, type = 'video') {
        try {
            console.log(`🔍 Searching YouTube for: ${query}`);
            const searchResults = await ytSearch(query);
            
            if (!searchResults.videos.length) {
                console.log('❌ No videos found');
                return null;
            }

            // Filter for appropriate content (exclude live streams, very long videos)
            const filteredVideos = searchResults.videos.filter(video => 
                !video.live && video.seconds < 600 && video.seconds > 30 // 30 seconds to 10 minutes
            );

            if (!filteredVideos.length) {
                console.log('❌ No suitable videos found after filtering');
                return null;
            }

            // Get a random video from top 5 results
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
                    highWaterMark: 1 << 25 // 32MB buffer
                }).pipe(fs.createWriteStream(filepath));

                stream.on('finish', () => {
                    console.log(`✅ Audio downloaded: ${filename}`);
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    console.log('❌ Audio download error:', error.message);
                    // Clean up failed download
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                    }
                    reject(null);
                });
                
                // Add timeout
                setTimeout(() => {
                    if (fs.existsSync(filepath) && fs.statSync(filepath).size === 0) {
                        stream.destroy();
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath);
                        }
                        reject(null);
                    }
                }, 30000); // 30 second timeout
            });
        } catch (error) {
            console.log('❌ YouTube audio download error:', error.message);
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
            const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            const filename = `video_${title}_${Date.now()}.mp4`;
            const filepath = path.join(this.downloadDir, filename);

            console.log(`⬇️ Downloading video: ${info.videoDetails.title}`);

            return new Promise((resolve, reject) => {
                const stream = ytdl(videoUrl, { 
                    quality: 'lowest',
                    filter: format => format.container === 'mp4' && format.hasVideo,
                    highWaterMark: 1 << 25 // 32MB buffer
                }).pipe(fs.createWriteStream(filepath));

                stream.on('finish', () => {
                    console.log(`✅ Video downloaded: ${filename}`);
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    console.log('❌ Video download error:', error.message);
                    // Clean up failed download
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                    }
                    reject(null);
                });
                
                // Add timeout
                setTimeout(() => {
                    if (fs.existsSync(filepath) && fs.statSync(filepath).size === 0) {
                        stream.destroy();
                        if (fs.existsSync(filepath)) {
                            fs.unlinkSync(filepath);
                        }
                        reject(null);
                    }
                }, 45000); // 45 second timeout for videos
            });
        } catch (error) {
            console.log('❌ YouTube video download error:', error.message);
            return null;
        }
    }

    // NEW: Test download methods
    async downloadTestContent() {
        console.log('🎵 Downloading test audio content...');
        try {
            // Use predefined test URLs or search for short content
            const testUrl = this.testContent.audio[0]; // Use first test URL
            const audioPath = await this.downloadYouTubeAudio(testUrl);
            
            if (audioPath) {
                return audioPath;
            }
            
            // Fallback: search for short audio
            console.log('🔄 Trying fallback audio search...');
            const fallbackUrl = await this.searchYouTube('lofi hip hop 1 minute');
            if (fallbackUrl) {
                return await this.downloadYouTubeAudio(fallbackUrl);
            }
            
            return null;
        } catch (error) {
            console.log('❌ Test audio download failed:', error.message);
            return null;
        }
    }

    async downloadTestMedia() {
        console.log('🎬 Downloading test video content...');
        try {
            // Use predefined test URLs or search for short content
            const testUrl = this.testContent.video[0]; // Use first test URL
            const videoPath = await this.downloadYouTubeVideo(testUrl);
            
            if (videoPath) {
                return videoPath;
            }
            
            // Fallback: search for short video
            console.log('🔄 Trying fallback video search...');
            const fallbackUrl = await this.searchYouTube('nature 1 minute');
            if (fallbackUrl) {
                return await this.downloadYouTubeVideo(fallbackUrl);
            }
            
            return null;
        } catch (error) {
            console.log('❌ Test video download failed:', error.message);
            return null;
        }
    }

    // NEW: Quick test download (very short content)
    async downloadQuickTest() {
        console.log('⚡ Downloading quick test content...');
        try {
            // Search for very short content (under 2 minutes)
            const quickUrl = await this.searchYouTube('ambient music 30 seconds');
            if (quickUrl) {
                const audioPath = await this.downloadYouTubeAudio(quickUrl);
                return audioPath;
            }
            return null;
        } catch (error) {
            console.log('❌ Quick test download failed:', error.message);
            return null;
        }
    }

    // Existing methods with improved error handling
    async downloadMusicByGenre(genre, queries) {
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

    // NEW: Cleanup method to remove old files
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

    // NEW: Get download directory stats
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
                directory: this.downloadDir
            };
        } catch (error) {
            return { fileCount: 0, totalSize: '0MB', directory: this.downloadDir };
        }
    }
}

module.exports = ContentDownloader;
