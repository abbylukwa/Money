const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const { PORT, ADMINS } = require("./config");

// Import from plugins folder
const MusicManager = require("./plugins/group-manager/music-manager");
const ComedyManager = require("./plugins/group-manager/comedy-manager");
const ContentDownloader = require("./plugins/group-manager/content-downloader");
const Scheduler = require("./plugins/group-manager/scheduler");

const app = express();

let sock = null;
let isConnected = false;
let musicManager = null;
let comedyManager = null;
let contentDownloader = new ContentDownloader();
let scheduler = new Scheduler();

const CHANNELS = {
    music: '0029VbBn8li3LdQQcJbvwm2S@g.us',
    entertainment: '0029Vb6GzqcId7nWURAdJv0M@g.us'
};

const COMMANDS = {
    'hello': '👋 Hello! I\'m Abby WhatsApp Bot.',
    'hi': '👋 Hi there!',
    'ping': '🏓 Pong! Abby is online!',
    'menu': `📱 *Abby Bot Commands*

🔄 *Basic Commands:*
• hello/hi - Greeting
• ping - Check status
• menu - Show this menu

🎵 *Music Commands:*
• music schedule - Show music schedule
• music chart - Current chart toppers

🎭 *Comedy Commands:*
• comedy - Random comedy content
• meme - Send funny memes
• quote - Motivational quote

📊 *Stats Commands:*
• stats - Bot statistics
• download stats - Download system status`,

    'default': '🤖 I\'m Abby WhatsApp Bot. Type "menu" for commands.'
};

// Ensure sessions directory exists
if (!fs.existsSync('./sessions')) {
    fs.mkdirSync('./sessions', { recursive: true });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Abby WhatsApp Bot - QR Code Connection</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
                text-align: center;
            }
            .logo {
                margin-bottom: 30px;
            }
            .logo h1 {
                color: #333;
                font-size: 28px;
                margin-bottom: 10px;
            }
            .status {
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .online { background: #d4edda; color: #155724; }
            .offline { background: #f8d7da; color: #721c24; }
            .qr-instructions {
                background: #e3f2fd;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: left;
            }
            button {
                padding: 15px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
                margin: 10px;
            }
            button:hover {
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>🤖 Abby WhatsApp Bot</h1>
                <p>QR Code Authentication System</p>
            </div>
            
            <div class="status ${isConnected ? 'online' : 'offline'}" id="status">
                ${isConnected ? '✅ Bot is ONLINE & Connected' : '❌ Bot is OFFLINE - Scan QR Code'}
            </div>

            <div class="qr-instructions">
                <h3>📱 How to Connect:</h3>
                <ol style="margin: 10px 0 10px 20px;">
                    <li>Start the bot (node index.js)</li>
                    <li>Check terminal for QR code</li>
                    <li>Open WhatsApp on your phone</li>
                    <li>Go to Settings → Linked Devices</li>
                    <li>Tap "Link a Device"</li>
                    <li>Scan the QR code from terminal</li>
                    <li>Wait for connection confirmation</li>
                </ol>
            </div>

            <div style="margin-top: 20px; font-size: 14px; color: #666;">
                <p>💡 The bot will automatically reconnect if disconnected</p>
                <p>🔄 QR codes expire after 1 minute</p>
                <p>🔧 Using plugin system for better organization</p>
            </div>
        </div>

        <script>
            async function checkConnectionStatus() {
                try {
                    const response = await fetch('/status');
                    const data = await response.json();
                    
                    if (data.isConnected) {
                        document.getElementById('status').className = 'status online';
                        document.getElementById('status').textContent = '✅ Bot is ONLINE & Connected';
                    } else {
                        setTimeout(checkConnectionStatus, 3000);
                    }
                } catch (error) {
                    console.log('Error checking status:', error);
                    setTimeout(checkConnectionStatus, 3000);
                }
            }

            // Check initial status
            checkConnectionStatus();
        </script>
    </body>
    </html>
    `);
});

app.get('/status', (req, res) => {
    res.json({ 
        isConnected: isConnected,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'online', 
        bot: 'Abby WhatsApp Bot',
        connected: isConnected,
        timestamp: new Date() 
    });
});

async function connectToWhatsApp() {
    try {
        console.log('🔗 Initializing WhatsApp connection...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./sessions');
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: true,
            syncFullHistory: false
        });

        sock.ev.on('creds.update', saveCreds);

        let connectionStartTime = Date.now();
        let qrGenerated = false;

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !qrGenerated) {
                qrGenerated = true;
                console.log('\n🔍 SCAN THIS QR CODE WITH WHATSAPP:');
                console.log('========================================');
                qrcode.generate(qr, { small: true });
                console.log('========================================');
                console.log('⏰ QR code valid for 1 minute...\n');
            }

            if (connection === 'open' && !isConnected) {
                isConnected = true;
                const connectionTime = Math.round((Date.now() - connectionStartTime) / 1000);
                console.log(`✅ WhatsApp Connected Successfully!`);
                console.log(`⏰ Connection established in ${connectionTime} seconds`);
                
                musicManager = new MusicManager(sock, CHANNELS);
                comedyManager = new ComedyManager(sock, CHANNELS);
                
                startScheduledTasks();
                await sendOnlineNotification();
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    console.log('🔄 Attempting to reconnect in 5 seconds...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                } else {
                    console.log('❌ Device logged out. New QR code will be generated on reconnect.');
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected) return;
            
            const message = m.messages[0];
            if (message.key.fromMe || !message.message) return;

            const jid = message.key.remoteJid;
            const user = message.pushName || 'Unknown';
            const text = getMessageText(message).toLowerCase().trim();
            
            const isAdmin = ADMINS.includes(jid);
            
            if (!isAdmin) {
                console.log(`🚫 Ignoring message from non-admin: ${user}`);
                return;
            }
            
            console.log(`📨 Message from admin ${user}: ${text}`);
            
            let reply = await handleCommand(jid, text);
            
            try {
                await sock.sendMessage(jid, { text: reply });
                console.log(`✅ Reply sent to admin ${user}`);
            } catch (error) {
                console.error(`❌ Failed to send reply:`, error.message);
            }
        });

        return sock;

    } catch (error) {
        console.error('❌ Connection error:', error);
        console.log('🔄 Reconnecting in 5 seconds...');
        setTimeout(() => connectToWhatsApp(), 5000);
        return null;
    }
}

async function handleCommand(jid, text) {
    if (text === 'music schedule') {
        await musicManager.updateMusicSchedule();
        return "🎵 Music schedule updated!";
    }
    
    if (text === 'music chart') {
        await musicManager.postChartToppers();
        return "🏆 Chart toppers posted!";
    }
    
    if (text === 'comedy') {
        await comedyManager.postComedianContent('random');
        return "🎭 Comedy content posted!";
    }
    
    if (text === 'meme') {
        await comedyManager.sendMemes();
        return "😂 Memes sent!";
    }
    
    if (text === 'quote') {
        await comedyManager.sendHypingQuote();
        return "💫 Motivational quote sent!";
    }
    
    if (text === 'stats') {
        const musicStats = musicManager.getStats();
        const comedyStats = comedyManager.getStats();
        const downloadStats = contentDownloader.getDownloadStats();
        
        return `📊 *BOT STATISTICS*\n\n` +
               `🎵 *Music:* ${musicStats.songsPlayed} songs played\n` +
               `🎭 *Comedy:* ${comedyStats.comedyPosts} posts\n` +
               `😂 *Memes:* ${comedyStats.memesSent} sent\n` +
               `💫 *Quotes:* ${comedyStats.quotesSent} sent\n` +
               `📥 *Downloads:* ${downloadStats.fileCount} files (${downloadStats.totalSize})\n` +
               `🔒 *Safety Mode:* ${downloadStats.safetyMode ? 'ON' : 'OFF'}`;
    }
    
    if (text === 'download stats') {
        const downloadStats = contentDownloader.getDownloadStats();
        const safetyStatus = contentDownloader.getSafetyStatus();
        
        return `📥 *DOWNLOAD SYSTEM*\n\n` +
               `📁 *Files:* ${downloadStats.fileCount}\n` +
               `💾 *Size:* ${downloadStats.totalSize}\n` +
               `📂 *Directory:* ${downloadStats.directory}\n` +
               `🔒 *Safety Mode:* ${safetyStatus.status}\n` +
               `💬 *Status:* ${safetyStatus.message}`;
    }
    
    return COMMANDS[text] || COMMANDS.default;
}

function getMessageText(message) {
    if (message.message.conversation) {
        return message.message.conversation;
    }
    if (message.message.extendedTextMessage) {
        return message.message.extendedTextMessage.text;
    }
    if (message.message.imageMessage) {
        return message.message.imageMessage.caption || '';
    }
    if (message.message.videoMessage) {
        return message.message.videoMessage.caption || '';
    }
    return '';
}

function startScheduledTasks() {
    console.log('⏰ Starting scheduled tasks...');
    
    // Music schedule updates
    scheduler.scheduleTask('0 6,9,12,15,18,21 * * *', () => {
        if (isConnected) musicManager.updateMusicSchedule();
    });
    
    // Comedy content
    scheduler.scheduleTask('0 12,16,20 * * *', () => {
        if (isConnected) comedyManager.postComedianContent('lunch');
    });
    
    // Chart toppers
    scheduler.scheduleTask('0 21 * * *', () => {
        if (isConnected) musicManager.postChartToppers();
    });
    
    // Motivational quotes
    scheduler.scheduleTask('*/30 * * * *', () => {
        if (isConnected) comedyManager.sendHypingQuote();
    });
    
    // Memes
    scheduler.scheduleTask('0 */2 * * *', () => {
        if (isConnected) comedyManager.sendMemes();
    });
    
    // Cleanup
    scheduler.scheduleTask('0 2 * * *', () => {
        contentDownloader.cleanupOldFiles(24);
    });
    
    console.log('✅ All scheduled tasks started');
}

async function sendOnlineNotification() {
    if (!sock || !isConnected) return;
    
    const onlineMessage = `🤖 *Abby WhatsApp Bot - Online!*\n\n` +
                         `✅ *Your bot is now connected via QR Code!*\n\n` +
                         `✨ *Features Active:*\n` +
                         `• Auto-reply to admin messages\n` +
                         `• Music management\n` +
                         `• Comedy content posting\n` +
                         `• Scheduled tasks\n` +
                         `• File downloads\n\n` +
                         `🌐 *24/7 Operation:*\n` +
                         `• Bot stays online continuously\n` +
                         `• Auto-reconnect if disconnected\n` +
                         `• Works when you're offline\n\n` +
                         `⏰ Connected at: ${new Date().toLocaleString()}`;

    for (const admin of ADMINS) {
        try {
            await sock.sendMessage(admin, { text: onlineMessage });
            console.log(`📤 Online notification sent to admin: ${admin}`);
        } catch (error) {
            console.log(`❌ Could not send online message to ${admin}:`, error.message);
        }
    }
}

async function startApplication() {
    try {
        console.log('🚀 Starting Abby WhatsApp Bot...');
        console.log('🔐 Authentication: QR Code Only');
        console.log(`🌐 Web interface: http://localhost:${PORT}`);
        console.log(`👑 Admins: ${ADMINS.length} configured`);
        console.log(`📁 Plugin system: Active (group-manager)`);
        
        // Always try to connect (will use existing session or generate QR)
        await connectToWhatsApp();
        
        const server = app.listen(PORT, () => {
            console.log(`🌐 Web server running on port ${PORT}`);
            console.log(`📱 QR Code system: READY`);
            console.log(`💬 Auto-reply system: ${isConnected ? 'ACTIVE' : 'WAITING FOR CONNECTION'}`);
            console.log(`🎵 Music Manager: LOADED`);
            console.log(`🎭 Comedy Manager: LOADED`);
            console.log(`📥 Content Downloader: LOADED`);
            console.log(`⏰ Scheduler: LOADED`);
            console.log('\n📝 **INSTRUCTIONS:**');
            console.log('1. Check terminal for QR code');
            console.log('2. Scan QR with WhatsApp → Linked Devices');
            console.log('3. Bot will connect automatically');
            console.log('4. Use "menu" command to see available commands');
        });
        
        process.on('SIGTERM', () => {
            console.log('🔄 Received SIGTERM, cleaning up...');
            scheduler.stopAll();
            server.close(() => {
                console.log('🌐 Web server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('🔄 Received SIGINT, shutting down...');
            scheduler.stopAll();
            server.close(() => {
                console.log('🌐 Web server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
}

startApplication().catch(console.error);
