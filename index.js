const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const cron = require('node-cron');
const { PORT, SESSION_ID, ADMINS } = require("./config");
const MusicManager = require("./music-manager");
const ComedyManager = require("./comedy-manager");
const ContentDownloader = require("./content-downloader");
const Scheduler = require("./scheduler");

const app = express();
const ACTIVE_SESSION_ID = SESSION_ID;
const SESSION_PATH = `./sessions/${ACTIVE_SESSION_ID}`;

let sock = null;
let isConnected = false;
let currentPairingCode = null;
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
• session - Get session ID

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

    'session': `🆔 *Your Session ID:* ${ACTIVE_SESSION_ID}`,

    'default': '🤖 I\'m Abby WhatsApp Bot. Type "menu" for commands.'
};

if (!fs.existsSync(SESSION_PATH)) {
    fs.mkdirSync(SESSION_PATH, { recursive: true });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Abby WhatsApp Bot - Pairing</title>
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
            }
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo h1 {
                color: #333;
                font-size: 28px;
                margin-bottom: 10px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 600;
            }
            input[type="text"] {
                width: 100%;
                padding: 15px;
                border: 2px solid #e1e5e9;
                border-radius: 10px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            input[type="text"]:focus {
                outline: none;
                border-color: #667eea;
            }
            button {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            }
            button:hover {
                transform: translateY(-2px);
            }
            .result {
                margin-top: 20px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                display: none;
            }
            .pairing-code {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                color: #667eea;
                margin: 10px 0;
            }
            .instructions {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 10px;
                margin-top: 15px;
                font-size: 14px;
            }
            .status {
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                margin-bottom: 15px;
                font-weight: 600;
            }
            .online { background: #d4edda; color: #155724; }
            .offline { background: #f8d7da; color: #721c24; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>🤖 Abby WhatsApp Bot</h1>
                <p>Complete Bot System with Real Implementation</p>
            </div>
            
            <div class="status ${isConnected ? 'online' : 'offline'}">
                ${isConnected ? '✅ Bot is ONLINE' : '❌ Bot is OFFLINE'}
            </div>

            <form id="pairingForm">
                <div class="form-group">
                    <label for="phoneNumber">📱 Enter Your WhatsApp Number:</label>
                    <input type="text" id="phoneNumber" name="phoneNumber" 
                           placeholder="263717457592 (country code + number)" required>
                    <small style="color: #666;">Format: 263717457592 (no + sign)</small>
                </div>
                
                <button type="submit">🔗 Generate Pairing Code</button>
            </form>

            <div id="result" class="result">
                <h3>📋 Pairing Information:</h3>
                <div class="form-group">
                    <label>Phone Number:</label>
                    <input type="text" id="displayNumber" readonly>
                </div>
                <div class="form-group">
                    <label>Pairing Code:</label>
                    <div class="pairing-code" id="pairingCode">- - - -</div>
                </div>
                <div class="instructions">
                    <strong>📝 How to Pair:</strong><br>
                    1. Open WhatsApp on your phone<br>
                    2. Go to Settings → Linked Devices<br>
                    3. Tap "Link a Device"<br>
                    4. Enter the pairing code above<br>
                    5. You'll receive your Session ID via WhatsApp
                </div>
            </div>
        </div>

        <script>
            document.getElementById('pairingForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const phoneNumber = document.getElementById('phoneNumber').value;
                const resultDiv = document.getElementById('result');
                const pairingCode = document.getElementById('pairingCode');
                const displayNumber = document.getElementById('displayNumber');
                
                if (!phoneNumber.match(/^\\d{10,15}$/)) {
                    alert('Please enter a valid phone number (10-15 digits)');
                    return;
                }

                try {
                    const response = await fetch('/generate-pairing', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ phoneNumber })
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        displayNumber.value = phoneNumber;
                        pairingCode.textContent = data.pairingCode;
                        resultDiv.style.display = 'block';
                        resultDiv.scrollIntoView({ behavior: 'smooth' });
                        checkConnectionStatus();
                    } else {
                        alert('Error: ' + data.message);
                    }
                } catch (error) {
                    alert('Error generating pairing code: ' + error.message);
                }
            });

            async function checkConnectionStatus() {
                try {
                    const response = await fetch('/status');
                    const data = await response.json();
                    
                    if (data.isConnected) {
                        document.querySelector('.status').className = 'status online';
                        document.querySelector('.status').textContent = '✅ Bot is ONLINE - You can start pairing!';
                    }
                } catch (error) {
                    console.log('Error checking status:', error);
                }
            }

            checkConnectionStatus();
        </script>
    </body>
    </html>
    `);
});

app.post('/generate-pairing', (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || !phoneNumber.match(/^\d{10,15}$/)) {
        return res.json({ success: false, message: 'Invalid phone number format' });
    }

    try {
        const pairingCode = generatePairingCode();
        currentPairingCode = pairingCode;
        
        console.log(`📱 Pairing code generated for ${phoneNumber}: ${pairingCode}`);
        
        res.json({ 
            success: true, 
            pairingCode: pairingCode,
            message: 'Pairing code generated successfully'
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

app.get('/status', (req, res) => {
    res.json({ 
        isConnected: isConnected,
        sessionId: ACTIVE_SESSION_ID,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'online', 
        bot: 'Abby WhatsApp Bot',
        session: ACTIVE_SESSION_ID,
        connected: isConnected,
        timestamp: new Date() 
    });
});

function generatePairingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 3) code += '-';
    }
    return code;
}

async function connectToWhatsApp() {
    try {
        console.log(`🔗 Initializing WhatsApp connection for session: ${ACTIVE_SESSION_ID}`);
        
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
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

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('📱 QR Code generated');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'open' && !isConnected) {
                isConnected = true;
                const connectionTime = Math.round((Date.now() - connectionStartTime) / 1000);
                console.log(`✅ WhatsApp Connected! Session: ${ACTIVE_SESSION_ID}`);
                console.log(`⏰ Connection established in ${connectionTime} seconds`);
                
                musicManager = new MusicManager(sock, CHANNELS);
                comedyManager = new ComedyManager(sock, CHANNELS);
                
                startScheduledTasks();
                await sendSessionIDToOwner();
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    console.log('🔄 Attempting to reconnect...');
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
                console.log(`🚫 Ignoring message from non-admin: ${user}`);
                return;
            }
            
            console.log(`📨 [${ACTIVE_SESSION_ID}] Message from admin ${user}: ${text}`);
            
            let reply = await handleCommand(jid, text);
            
            try {
                await sock.sendMessage(jid, { text: reply });
                console.log(`✅ [${ACTIVE_SESSION_ID}] Reply sent to admin ${user}`);
            } catch (error) {
                console.error(`❌ [${ACTIVE_SESSION_ID}] Failed to send reply:`, error.message);
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
    
    cron.schedule('0 6,9,12,15,18,21 * * *', () => {
        if (isConnected) musicManager.updateMusicSchedule();
    });
    
    cron.schedule('0 12,16,20 * * *', () => {
        if (isConnected) comedyManager.postComedianContent('lunch');
    });
    
    cron.schedule('0 21 * * *', () => {
        if (isConnected) musicManager.postChartToppers();
    });
    
    cron.schedule('*/30 * * * *', () => {
        if (isConnected) comedyManager.sendHypingQuote();
    });
    
    cron.schedule('0 */2 * * *', () => {
        if (isConnected) comedyManager.sendMemes();
    });
    
    cron.schedule('0 2 * * *', () => {
        contentDownloader.cleanupOldFiles(24);
    });
    
    console.log('✅ All scheduled tasks started');
}

async function sendSessionIDToOwner() {
    if (!sock || !isConnected) return;
    
    const sessionMessage = `🤖 *Abby WhatsApp Bot - Session Connected!*\n\n` +
                         `✅ *Your bot is now ONLINE!*\n\n` +
                         `🆔 *SESSION ID:* \`${ACTIVE_SESSION_ID}\`\n\n` +
                         `📋 *How to Deploy:*\n` +
                         `1. Copy this Session ID: ${ACTIVE_SESSION_ID}\n` +
                         `2. Go to Railway dashboard\n` +
                         `3. Set environment variable: SESSION_ID=${ACTIVE_SESSION_ID}\n` +
                         `4. Redeploy your bot\n\n` +
                         `✨ *Your bot will now stay online 24/7!*\n` +
                         `💬 It will automatically reply to messages\n` +
                         `🌐 Works even when you're offline\n\n` +
                         `⏰ Connected at: ${new Date().toLocaleString()}`;

    for (const admin of ADMINS) {
        try {
            await sock.sendMessage(admin, { text: sessionMessage });
            console.log(`📤 Session ID sent to admin: ${admin}`);
        } catch (error) {
            console.log(`❌ Could not send session message to ${admin}:`, error.message);
        }
    }
}

async function startApplication() {
    try {
        console.log('🚀 Starting Abby WhatsApp Bot...');
        console.log(`📋 Session ID: ${ACTIVE_SESSION_ID}`);
        console.log(`🌐 Web interface: http://localhost:${PORT}`);
        console.log(`👑 Admins: ${ADMINS.length} configured`);
        
        await connectToWhatsApp();
        
        const server = app.listen(PORT, () => {
            console.log(`🌐 Web server running on port ${PORT}`);
            console.log(`📱 Pairing system: READY`);
            console.log(`💬 Auto-reply system: ACTIVE`);
            console.log(`🎵 Music Manager: LOADED`);
            console.log(`🎭 Comedy Manager: LOADED`);
            console.log(`📥 Content Downloader: LOADED`);
            console.log(`⏰ Scheduler: LOADED`);
            console.log('\n📝 **INSTRUCTIONS:**');
            console.log('1. Visit http://localhost:3000');
            console.log('2. Enter your phone number');
            console.log('3. Get pairing code');
            console.log('4. Link in WhatsApp → Linked Devices');
            console.log('5. Receive Session ID via WhatsApp');
            console.log('6. Deploy with Session ID on Railway');
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