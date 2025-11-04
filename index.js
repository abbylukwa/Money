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

// QR Code state
let qrCode = null;
let qrGenerated = false;

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
            .waiting { background: #fff3cd; color: #856404; }
            .qr-instructions {
                background: #e3f2fd;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: left;
            }
            .qr-code {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                font-family: monospace;
                word-break: break-all;
                display: none;
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
            .terminal {
                background: #2d3748;
                color: #e2e8f0;
                padding: 20px;
                border-radius: 10px;
                font-family: monospace;
                text-align: left;
                margin: 20px 0;
                max-height: 300px;
                overflow-y: auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>🤖 Abby WhatsApp Bot</h1>
                <p>QR Code Authentication System</p>
            </div>
            
            <div class="status ${isConnected ? 'online' : (qrCode ? 'waiting' : 'offline')}" id="status">
                ${isConnected ? '✅ Bot is ONLINE & Connected' : (qrCode ? '⏳ QR Code Generated - Scan to Connect' : '❌ Bot is OFFLINE - Waiting for QR Code')}
            </div>

            <div class="qr-instructions">
                <h3>📱 How to Connect:</h3>
                <ol style="margin: 10px 0 10px 20px;">
                    <li>Check the terminal/console for QR code</li>
                    <li>Open WhatsApp on your phone</li>
                    <li>Go to Settings → Linked Devices</li>
                    <li>Tap "Link a Device"</li>
                    <li>Scan the QR code from terminal</li>
                    <li>Wait for connection confirmation</li>
                </ol>
            </div>

            <div class="terminal" id="terminal">
                <div>🔍 Waiting for QR code generation...</div>
            </div>

            <div style="margin-top: 20px; font-size: 14px; color: #666;">
                <p>💡 The bot will automatically reconnect if disconnected</p>
                <p>🔄 QR codes expire after 1 minute</p>
                <p>🔧 Using plugin system for better organization</p>
            </div>
        </div>

        <script>
            function updateTerminal(message) {
                const terminal = document.getElementById('terminal');
                const div = document.createElement('div');
                div.textContent = message;
                terminal.appendChild(div);
                terminal.scrollTop = terminal.scrollHeight;
            }

            async function checkStatus() {
                try {
                    const response = await fetch('/status');
                    const data = await response.json();
                    
                    const statusDiv = document.getElementById('status');
                    if (data.isConnected) {
                        statusDiv.className = 'status online';
                        statusDiv.textContent = '✅ Bot is ONLINE & Connected';
                    } else if (data.qrCode) {
                        statusDiv.className = 'status waiting';
                        statusDiv.textContent = '⏳ QR Code Generated - Scan to Connect';
                        updateTerminal('🔍 QR Code Generated in Terminal - Please check your console!');
                    } else {
                        statusDiv.className = 'status offline';
                        statusDiv.textContent = '❌ Bot is OFFLINE - Waiting for QR Code';
                    }
                    
                    // Update terminal with latest logs if available
                    if (data.terminalLogs) {
                        data.terminalLogs.forEach(log => {
                            if (!document.querySelector(`[data-log="${log.id}"]`)) {
                                updateTerminal(log.message);
                            }
                        });
                    }
                } catch (error) {
                    console.log('Error checking status:', error);
                }
                
                setTimeout(checkStatus, 2000);
            }

            // Start checking status
            checkStatus();
        </script>
    </body>
    </html>
    `);
});

app.get('/status', (req, res) => {
    res.json({ 
        isConnected: isConnected,
        qrCode: !!qrCode,
        terminalLogs: [
            { id: 1, message: `🌐 Web server running on port ${PORT}` },
            { id: 2, message: `📱 QR Code system: ${qrCode ? 'ACTIVE' : 'WAITING'}` },
            { id: 3, message: `💬 Auto-reply system: ${isConnected ? 'ACTIVE' : 'WAITING FOR CONNECTION'}` }
        ],
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'online', 
        bot: 'Abby WhatsApp Bot',
        connected: isConnected,
        qrActive: !!qrCode,
        timestamp: new Date() 
    });
});

// Store terminal logs
const terminalLogs = [];

function logToTerminal(message) {
    const logEntry = {
        id: terminalLogs.length + 1,
        message: message,
        timestamp: new Date()
    };
    terminalLogs.push(logEntry);
    console.log(message);
    
    // Keep only last 50 logs
    if (terminalLogs.length > 50) {
        terminalLogs.shift();
    }
}

async function connectToWhatsApp() {
    try {
        logToTerminal('🔗 Initializing WhatsApp connection...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./sessions');
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false
            // Removed printQRInTerminal as it's deprecated
        });

        sock.ev.on('creds.update', saveCreds);

        let connectionStartTime = Date.now();
        let qrDisplayed = false;

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Handle QR Code manually
            if (qr && !qrDisplayed) {
                qrCode = qr;
                qrDisplayed = true;
                logToTerminal('\n🔍 SCAN THIS QR CODE WITH WHATSAPP:');
                logToTerminal('========================================');
                
                // Generate QR code in terminal
                qrcode.generate(qr, { small: true }, function (qrcode) {
                    console.log(qrcode);
                    logToTerminal(qrcode);
                });
                
                logToTerminal('========================================');
                logToTerminal('⏰ QR code valid for 1 minute...\n');
                
                // Set timeout to clear QR code after 1 minute
                setTimeout(() => {
                    if (!isConnected && qrDisplayed) {
                        logToTerminal('🔄 QR code expired. Generating new one...');
                        qrDisplayed = false;
                        qrCode = null;
                    }
                }, 60000);
            }

            if (connection === 'open' && !isConnected) {
                isConnected = true;
                qrCode = null;
                qrDisplayed = false;
                const connectionTime = Math.round((Date.now() - connectionStartTime) / 1000);
                logToTerminal(`✅ WhatsApp Connected Successfully!`);
                logToTerminal(`⏰ Connection established in ${connectionTime} seconds`);
                
                musicManager = new MusicManager(sock, CHANNELS);
                comedyManager = new ComedyManager(sock, CHANNELS);
                
                startScheduledTasks();
                await sendOnlineNotification();
            }

            if (connection === 'close') {
                logToTerminal('❌ Connection closed');
                isConnected = false;
                qrDisplayed = false;
                qrCode = null;
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    logToTerminal('🔄 Attempting to reconnect in 5 seconds...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                } else {
                    logToTerminal('❌ Device logged out. Please delete session folder and scan QR again.');
                    // Clear session to force new QR code
                    if (fs.existsSync('./sessions')) {
                        fs.rmSync('./sessions', { recursive: true, force: true });
                    }
                    setTimeout(() => connectToWhatsApp(), 5000);
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
                logToTerminal(`🚫 Ignoring message from non-admin: ${user}`);
                return;
            }
            
            logToTerminal(`📨 Message from admin ${user}: ${text}`);
            
            let reply = await handleCommand(jid, text);
            
            try {
                await sock.sendMessage(jid, { text: reply });
                logToTerminal(`✅ Reply sent to admin ${user}`);
            } catch (error) {
                logToTerminal(`❌ Failed to send reply: ${error.message}`);
            }
        });

        return sock;

    } catch (error) {
        logToTerminal(`❌ Connection error: ${error.message}`);
        logToTerminal('🔄 Reconnecting in 5 seconds...');
        setTimeout(() => connectToWhatsApp(), 5000);
        return null;
    }
}

async function handleCommand(jid, text) {
    if (!musicManager || !comedyManager) {
        return "🔄 Bot is still initializing, please wait...";
    }
    
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
    logToTerminal('⏰ Starting scheduled tasks...');
    
    // Music schedule updates
    scheduler.scheduleTask('0 6,9,12,15,18,21 * * *', () => {
        if (isConnected && musicManager) {
            musicManager.updateMusicSchedule();
        }
    }, 'Music Schedule Update');
    
    // Comedy content
    scheduler.scheduleTask('0 12,16,20 * * *', () => {
        if (isConnected && comedyManager) {
            comedyManager.postComedianContent('lunch');
        }
    }, 'Comedy Content');
    
    // Chart toppers
    scheduler.scheduleTask('0 21 * * *', () => {
        if (isConnected && musicManager) {
            musicManager.postChartToppers();
        }
    }, 'Chart Toppers');
    
    // Motivational quotes
    scheduler.scheduleTask('*/30 * * * *', () => {
        if (isConnected && comedyManager) {
            comedyManager.sendHypingQuote();
        }
    }, 'Motivational Quotes');
    
    // Memes
    scheduler.scheduleTask('0 */2 * * *', () => {
        if (isConnected && comedyManager) {
            comedyManager.sendMemes();
        }
    }, 'Memes');
    
    // Cleanup
    scheduler.scheduleTask('0 2 * * *', () => {
        contentDownloader.cleanupOldFiles(24);
    }, 'Cleanup Old Files');
    
    logToTerminal('✅ All scheduled tasks started');
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
            logToTerminal(`📤 Online notification sent to admin: ${admin}`);
        } catch (error) {
            logToTerminal(`❌ Could not send online message to ${admin}: ${error.message}`);
        }
    }
}

async function startApplication() {
    try {
        logToTerminal('🚀 Starting Abby WhatsApp Bot...');
        logToTerminal('🔐 Authentication: QR Code Only');
        logToTerminal(`🌐 Web interface: http://localhost:${PORT}`);
        logToTerminal(`👑 Admins: ${ADMINS.length} configured`);
        logToTerminal(`📁 Plugin system: Active (group-manager)`);
        
        // Clear any existing sessions to force QR code generation
        if (fs.existsSync('./sessions')) {
            logToTerminal('🧹 Clearing existing sessions...');
            fs.rmSync('./sessions', { recursive: true, force: true });
        }
        
        // Always try to connect (will use existing session or generate QR)
        await connectToWhatsApp();
        
        const server = app.listen(PORT, () => {
            logToTerminal(`🌐 Web server running on port ${PORT}`);
            logToTerminal('📝 **INSTRUCTIONS:**');
            logToTerminal('1. Check terminal for QR code');
            logToTerminal('2. Scan QR with WhatsApp → Linked Devices');
            logToTerminal('3. Bot will connect automatically');
            logToTerminal('4. Use "menu" command to see available commands');
        });
        
        process.on('SIGTERM', () => {
            logToTerminal('🔄 Received SIGTERM, cleaning up...');
            scheduler.stopAll();
            server.close(() => {
                logToTerminal('🌐 Web server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logToTerminal('🔄 Received SIGINT, shutting down...');
            scheduler.stopAll();
            server.close(() => {
                logToTerminal('🌐 Web server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        logToTerminal(`❌ Failed to start application: ${error}`);
        process.exit(1);
    }
}

startApplication().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
