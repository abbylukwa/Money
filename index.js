const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys");
const { useMongoDBAuthState } = require("./mongo-auth");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const chalk = require("chalk");
const figlet = require("figlet");
const { PORT, ADMINS, MONGODB_URI, BOT_NUMBER } = require("./config");

const app = express();

let sock = null;
let isConnected = false;
let pairingCode = null;

// Display banner
console.log(chalk.yellow(figlet.textSync('KNIGHT BOT', { horizontalLayout: 'full' })));
console.log(chalk.cyan('🚀 Advanced WhatsApp Bot with MongoDB Support'));
console.log(chalk.green('=============================================\n'));

const COMMANDS = {
    'hello': '👋 Hello! I\'m Knight WhatsApp Bot.',
    'hi': '👋 Hi there!',
    'ping': '🏓 Pong! Knight Bot is online!',
    'menu': `📱 *Knight Bot Commands*

🔄 *Basic Commands:*
• hello/hi - Greeting
• ping - Check status
• menu - Show this menu

🎵 *Music Commands:*
• music schedule - Show music schedule
• music chart - Current chart toppers

🎭 *Entertainment Commands:*
• comedy - Random comedy content
• meme - Send funny memes
• quote - Motivational quote

📊 *Stats Commands:*
• stats - Bot statistics
• info - System information`,

    'default': '🤖 I\'m Knight WhatsApp Bot. Type "menu" for commands.'
};

// Ensure directories exist
if (!fs.existsSync('./sessions')) {
    fs.mkdirSync('./sessions', { recursive: true });
}
if (!fs.existsSync('./assets')) {
    fs.mkdirSync('./assets', { recursive: true });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('.'));

let qrCode = null;

// Web Interface
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Knight Bot - WhatsApp Connection</title>
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
            .pairing-code {
                background: #e3f2fd;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                color: #1976d2;
                border: 2px dashed #1976d2;
            }
            .instructions {
                background: #e3f2fd;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: left;
            }
            .terminal {
                background: #2d3748;
                color: #e2e8f0;
                padding: 20px;
                border-radius: 10px;
                font-family: 'Courier New', monospace;
                text-align: left;
                margin: 20px 0;
                max-height: 300px;
                overflow-y: auto;
                font-size: 14px;
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
            .stats {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                margin: 15px 0;
                text-align: left;
            }
            .stat-item {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                padding: 5px 0;
                border-bottom: 1px solid #e9ecef;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1>🤖 Knight WhatsApp Bot</h1>
                <p>Advanced Authentication System</p>
            </div>
            
            <div class="status ${isConnected ? 'online' : (qrCode || pairingCode ? 'waiting' : 'offline')}" id="status">
                ${isConnected ? '✅ Bot is ONLINE & Connected' : (qrCode ? '⏳ QR Code Generated - Scan to Connect' : (pairingCode ? '🔑 Pairing Code Ready - Use in WhatsApp' : '❌ Bot is OFFLINE - Waiting for Authentication'))}
            </div>

            ${pairingCode ? `
            <div class="pairing-code" id="pairingCode">
                ${pairingCode}
            </div>
            
            <div class="instructions">
                <h3>📱 How to Connect with Pairing Code:</h3>
                <ol style="margin: 10px 0 10px 20px;">
                    <li>Open WhatsApp on your phone</li>
                    <li>Go to Settings → Linked Devices</li>
                    <li>Tap "Link a Device"</li>
                    <li>Tap "Link with phone number instead"</li>
                    <li>Enter this pairing code: <strong>${pairingCode}</strong></li>
                    <li>Wait for connection confirmation</li>
                </ol>
            </div>
            ` : (qrCode ? `
            <div class="instructions">
                <h3>📱 How to Connect with QR Code:</h3>
                <ol style="margin: 10px 0 10px 20px;">
                    <li>Check the terminal/console for QR code</li>
                    <li>Open WhatsApp on your phone</li>
                    <li>Go to Settings → Linked Devices</li>
                    <li>Tap "Link a Device"</li>
                    <li>Scan the QR code from terminal</li>
                    <li>Wait for connection confirmation</li>
                </ol>
            </div>
            ` : '')}

            <div class="stats">
                <h3>📊 System Information</h3>
                <div class="stat-item">
                    <span>🔌 MongoDB:</span>
                    <span>${MONGODB_URI ? '✅ Connected' : '❌ Not Configured'}</span>
                </div>
                <div class="stat-item">
                    <span>📞 Bot Number:</span>
                    <span>${BOT_NUMBER || 'Not Set'}</span>
                </div>
                <div class="stat-item">
                    <span>👑 Admins:</span>
                    <span>${ADMINS.length}</span>
                </div>
                <div class="stat-item">
                    <span>🕒 Uptime:</span>
                    <span id="uptime">0s</span>
                </div>
            </div>

            <div class="terminal" id="terminal">
                <div>🔍 Waiting for authentication method...</div>
            </div>

            <button onclick="location.reload()">🔄 Refresh Status</button>
            <button onclick="fetch('/restart', {method: 'POST'})">🔄 Restart Bot</button>

            <div style="margin-top: 20px; font-size: 14px; color: #666;">
                <p>💡 The bot will automatically reconnect if disconnected</p>
                <p>🔄 Authentication codes expire after 1 minute</p>
                <p>🔧 Using ${MONGODB_URI ? 'MongoDB' : 'Session Files'} for persistent storage</p>
            </div>
        </div>

        <script>
            let startTime = Date.now();
            
            function updateUptime() {
                const uptime = Math.floor((Date.now() - startTime) / 1000);
                document.getElementById('uptime').textContent = uptime + 's';
            }
            
            setInterval(updateUptime, 1000);
            updateUptime();

            function updateTerminal(message) {
                const terminal = document.getElementById('terminal');
                const div = document.createElement('div');
                div.textContent = '> ' + message;
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
                        updateTerminal('Bot is connected and ready!');
                    } else if (data.qrCode) {
                        statusDiv.className = 'status waiting';
                        statusDiv.textContent = '⏳ QR Code Generated - Scan to Connect';
                        updateTerminal('QR Code Generated - Check terminal for scanning');
                    } else if (data.pairingCode) {
                        statusDiv.className = 'status waiting';
                        statusDiv.textContent = '🔑 Pairing Code Ready - Use in WhatsApp';
                        const pairingDiv = document.getElementById('pairingCode');
                        if (pairingDiv) {
                            pairingDiv.textContent = data.pairingCode;
                        }
                        updateTerminal('Pairing Code Generated: ' + data.pairingCode);
                    } else {
                        statusDiv.className = 'status offline';
                        statusDiv.textContent = '❌ Bot is OFFLINE - Waiting for Authentication';
                    }
                } catch (error) {
                    console.log('Error checking status:', error);
                    updateTerminal('Error checking status: ' + error.message);
                }
                
                setTimeout(checkStatus, 3000);
            }

            checkStatus();
        </script>
    </body>
    </html>
    `);
});

// API Routes
app.get('/status', (req, res) => {
    res.json({ 
        isConnected: isConnected,
        qrCode: !!qrCode,
        pairingCode: pairingCode,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'online', 
        bot: 'Knight WhatsApp Bot',
        connected: isConnected,
        qrActive: !!qrCode,
        pairingActive: !!pairingCode,
        mongodb: !!MONGODB_URI,
        timestamp: new Date() 
    });
});

app.post('/restart', (req, res) => {
    logToTerminal('🔄 Manual restart requested via web interface');
    res.json({ status: 'restarting' });
    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

const terminalLogs = [];

function logToTerminal(message) {
    const logEntry = {
        id: terminalLogs.length + 1,
        message: message,
        timestamp: new Date()
    };
    terminalLogs.push(logEntry);
    console.log(chalk.blue(`[${new Date().toLocaleTimeString()}]`) + ' ' + message);
    
    if (terminalLogs.length > 50) {
        terminalLogs.shift();
    }
}

// WhatsApp Connection
async function connectToWhatsApp() {
    try {
        logToTerminal('🔗 Initializing WhatsApp connection...');
        
        let authMethod = 'session';
        let connectionOptions = {};

        // Try MongoDB authentication first if configured
        if (MONGODB_URI && MONGODB_URI !== 'mongodb://localhost:27017') {
            try {
                logToTerminal('🔄 Attempting MongoDB authentication...');
                const { state, saveCreds } = await useMongoDBAuthState(MONGODB_URI, 'knight_bot');
                
                const { version } = await fetchLatestBaileysVersion();

                connectionOptions = {
                    version,
                    logger: pino({ level: "silent" }),
                    auth: state,
                    browser: Browsers.ubuntu('Chrome'),
                    syncFullHistory: false,
                    printQRInTerminal: false
                };

                sock = makeWASocket(connectionOptions);
                sock.ev.on('creds.update', saveCreds);
                authMethod = 'mongodb';
                logToTerminal('✅ MongoDB authentication initialized');
                
            } catch (mongoError) {
                logToTerminal('❌ MongoDB auth failed: ' + mongoError.message);
                logToTerminal('🔄 Falling back to session file authentication...');
                authMethod = 'session';
            }
        }
        
        // Fallback to session files
        if (authMethod === 'session') {
            const { state, saveCreds } = await useMultiFileAuthState('./sessions');
            const { version } = await fetchLatestBaileysVersion();

            connectionOptions = {
                version,
                logger: pino({ level: "silent" }),
                auth: state,
                browser: Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                printQRInTerminal: true
            };

            sock = makeWASocket(connectionOptions);
            sock.ev.on('creds.update', saveCreds);
            logToTerminal('✅ Session file authentication initialized');
        }

        let connectionStartTime = Date.now();
        let qrDisplayed = false;

        // Connection event handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr, isNewLogin } = update;

            // Handle QR Code
            if (qr && !qrDisplayed) {
                qrCode = qr;
                qrDisplayed = true;
                pairingCode = null;
                
                logToTerminal('\n🔍 QR CODE GENERATED - SCAN WITH WHATSAPP');
                logToTerminal('==========================================');
                
                qrcode.generate(qr, { small: true }, function (qrcode) {
                    console.log(qrcode);
                });
                
                logToTerminal('==========================================\n');
                
                // QR code expiration
                setTimeout(() => {
                    if (!isConnected && qrDisplayed) {
                        logToTerminal('🔄 QR code expired. Regenerating...');
                        qrDisplayed = false;
                        qrCode = null;
                    }
                }, 60000);
            }

            // Handle successful connection
            if (connection === 'open' && !isConnected) {
                isConnected = true;
                qrCode = null;
                pairingCode = null;
                qrDisplayed = false;
                
                const connectionTime = Math.round((Date.now() - connectionStartTime) / 1000);
                logToTerminal('🎉 WhatsApp Connected Successfully!');
                logToTerminal(`⏰ Connection established in ${connectionTime} seconds`);
                
                const user = sock.user;
                logToTerminal(`👤 Connected as: ${user.name || user.id}`);
                
                await sendOnlineNotification();
            }

            // Handle connection close
            if (connection === 'close') {
                logToTerminal('❌ WhatsApp connection closed');
                isConnected = false;
                qrDisplayed = false;
                qrCode = null;
                pairingCode = null;
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    logToTerminal('🔄 Attempting to reconnect in 5 seconds...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                } else {
                    logToTerminal('❌ Device logged out. Cleaning up and restarting...');
                    if (fs.existsSync('./sessions')) {
                        fs.rmSync('./sessions', { recursive: true, force: true });
                    }
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }
        });

        // Message handler
        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected) return;
            
            const message = m.messages[0];
            if (message.key.fromMe || !message.message) return;

            const jid = message.key.remoteJid;
            const user = message.pushName || 'Unknown';
            const text = getMessageText(message).toLowerCase().trim();
            
            const isAdmin = ADMINS.includes(jid);
            
            // Log all messages but only respond to admins
            logToTerminal(`📨 Message from ${user} (${isAdmin ? 'Admin' : 'User'}): ${text}`);
            
            if (!isAdmin) {
                logToTerminal('🚫 Ignoring message from non-admin user');
                return;
            }
            
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

// Command handler
async function handleCommand(jid, text) {
    if (!sock || !isConnected) {
        return "🔄 Bot is still connecting, please wait...";
    }
    
    // Basic commands
    if (text === 'ping') {
        return '🏓 Pong! Knight Bot is alive and running!';
    }
    
    if (text === 'info' || text === 'stats') {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        return `📊 *Knight Bot Statistics*

🤖 *Bot Info:*
• Name: ${global.botname}
• Version: 2.0.0
• Uptime: ${hours}h ${minutes}m ${seconds}s
• Connection: ${isConnected ? '✅ Connected' : '❌ Disconnected'}

🗄️ *Storage:*
• MongoDB: ${MONGODB_URI ? '✅ Enabled' : '❌ Disabled'}
• Session: ${fs.existsSync('./sessions') ? '✅ Active' : '❌ None'}

👥 *Users:*
• Admins: ${ADMINS.length}
• Status: ✅ Operational

💡 *Features:*
• Auto-reply system
• MongoDB integration  
• Web dashboard
• Multi-auth support`;
    }
    
    return COMMANDS[text] || COMMANDS.default;
}

// Utility function to extract message text
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
    if (message.message.documentMessage) {
        return message.message.documentMessage.caption || '';
    }
    return '';
}

// Send online notification to admins
async function sendOnlineNotification() {
    if (!sock || !isConnected) return;
    
    const onlineMessage = `🤖 *Knight Bot - Online!*

✅ *Your bot is now connected and ready!*

✨ *Features Active:*
• Auto-reply to admin messages
• MongoDB persistent storage
• Web dashboard interface
• Multi-authentication support
• 24/7 operation

🌐 *System Information:*
• Storage: ${MONGODB_URI ? 'MongoDB' : 'Session Files'}
• Admins: ${ADMINS.length}
• Version: 2.0.0

⏰ Connected at: ${new Date().toLocaleString()}

Type "menu" to see available commands.`;

    for (const admin of ADMINS) {
        try {
            await sock.sendMessage(admin, { text: onlineMessage });
            logToTerminal(`📤 Online notification sent to admin: ${admin}`);
        } catch (error) {
            logToTerminal(`❌ Could not send online message to ${admin}: ${error.message}`);
        }
    }
}

// Start the application
async function startApplication() {
    try {
        logToTerminal('🚀 Starting Knight WhatsApp Bot...');
        logToTerminal('🔐 Authentication Methods: QR Code & Session Files');
        logToTerminal(`🌐 Web Interface: http://localhost:${PORT}`);
        logToTerminal(`👑 Configured Admins: ${ADMINS.length}`);
        
        if (MONGODB_URI && MONGODB_URI !== 'mongodb://localhost:27017') {
            logToTerminal(`🗄️ MongoDB: ${MONGODB_URI}`);
        } else {
            logToTerminal('🗄️ Storage: Local session files (MongoDB not configured)');
        }
        
        if (BOT_NUMBER) {
            logToTerminal(`📞 Bot Number: ${BOT_NUMBER}`);
        } else {
            logToTerminal('📞 Bot Number: Not specified (using QR code)');
        }
        
        // Start WhatsApp connection
        await connectToWhatsApp();
        
        // Start web server
        const server = app.listen(PORT, () => {
            logToTerminal(`🌐 Web server running on port ${PORT}`);
            logToTerminal('\n📝 **CONNECTION INSTRUCTIONS:**');
            logToTerminal('1. Open the web interface in your browser');
            logToTerminal('2. Check terminal for QR code or web for pairing code');
            logToTerminal('3. Scan QR code or use pairing code in WhatsApp');
            logToTerminal('4. Bot will connect automatically');
            logToTerminal('5. Use "menu" command in WhatsApp to see commands\n');
        });
        
        // Graceful shutdown handlers
        process.on('SIGTERM', () => {
            logToTerminal('🔄 Received SIGTERM, cleaning up...');
            server.close(() => {
                logToTerminal('🌐 Web server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logToTerminal('🔄 Received SIGINT, shutting down...');
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

// Start the bot
startApplication().catch(error => {
    console.error(chalk.red('💥 Fatal error:'), error);
    process.exit(1);
});
