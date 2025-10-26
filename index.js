const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const { PORT } = require("./config");

// =============================================
// CONFIGURATION - SET YOUR SESSION ID HERE
// =============================================
const ACTIVE_SESSION_ID = "YOUR_SESSION_ID_HERE"; // ← REPLACE THIS WITH YOUR SESSION ID
// =============================================

// Admin configuration - will be notified when bot starts
const ADMINS = [
    '263717457592@s.whatsapp.net',
    '263777627210@s.whatsapp.net', 
    '27614159817@s.whatsapp.net'
];

// Session configuration
const SESSION_PATH = `./sessions/${ACTIVE_SESSION_ID}`;

// Auto-reply configuration
const AUTO_REPLIES = {
    'hello': '👋 Hello! I\'m WhatsBixby bot. How can I help you today?',
    'hi': '👋 Hi there! What can I do for you?',
    'ping': '🏓 Pong! WhatsBixby is online and running!',
    '!status': '🤖 *WhatsBixby Status*\n\n✅ Online & Active\n📱 Session: ' + ACTIVE_SESSION_ID + '\n⏰ Uptime: ' + new Date().toLocaleString(),
    'menu': '📱 *WhatsBixby Commands:*\n\n• hello/hi - Greeting\n• ping - Check bot status\n• !status - Detailed status\n• menu - Show this menu\n• owner - Bot owner info',
    'owner': '👨‍💻 *Bot Owner:*\n\n📧 Contact: mruniquehacker@protonmail.com\n📺 YouTube: @mr_unique_hacker\n💬 Telegram: t.me/mruniquehacker',
    'default': '🤖 I\'m WhatsBixby, an advanced WhatsApp bot. Type "menu" to see available commands.'
};

// Process management
process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, cleaning up...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT, shutting down...');
    process.exit(0);
});

// Ensure session directory exists
if (!fs.existsSync(SESSION_PATH)) {
    fs.mkdirSync(SESSION_PATH, { recursive: true });
    console.log(`📁 Created session directory: ${SESSION_PATH}`);
}

async function connectToWhatsApp() {
    try {
        console.log(`🔗 Initializing WhatsApp connection for session: ${ACTIVE_SESSION_ID}`);
        
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: false
        });

        sock.ev.on('creds.update', saveCreds);

        let isConnected = false;
        let connectionStartTime = Date.now();

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('📱 QR Code generated - scan to connect');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'open' && !isConnected) {
                isConnected = true;
                const connectionTime = Math.round((Date.now() - connectionStartTime) / 1000);
                console.log(`✅ WhatsApp Connected! Session: ${ACTIVE_SESSION_ID}`);
                console.log(`⏰ Connection established in ${connectionTime} seconds`);
                
                // Notify admins
                notifyAdminsOnline(sock, connectionTime);
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    console.log('🔄 Attempting to reconnect...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                } else {
                    console.log('❌ Authentication failed - need new session');
                }
            }
        });

        // Message handling with auto-reply
        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected) return;
            
            const message = m.messages[0];
            if (message.key.fromMe || !message.message) return;

            const jid = message.key.remoteJid;
            const user = message.pushName || 'Unknown';
            const text = getMessageText(message).toLowerCase().trim();
            
            console.log(`📨 [${ACTIVE_SESSION_ID}] Message from ${user}: ${text}`);
            
            // Auto-reply logic
            if (text) {
                let reply = AUTO_REPLIES.default;
                
                // Check for exact matches first
                if (AUTO_REPLIES[text]) {
                    reply = AUTO_REPLIES[text];
                } else {
                    // Check for partial matches
                    for (const [key, value] of Object.entries(AUTO_REPLIES)) {
                        if (text.includes(key) && key !== 'default') {
                            reply = value;
                            break;
                        }
                    }
                }
                
                try {
                    await sock.sendMessage(jid, { text: reply });
                    console.log(`✅ [${ACTIVE_SESSION_ID}] Auto-reply sent to ${user}`);
                    
                    // Also notify admins about the interaction
                    if (!jid.includes('status@broadcast')) {
                        notifyAdminsInteraction(sock, user, text);
                    }
                } catch (error) {
                    console.error(`❌ [${ACTIVE_SESSION_ID}] Failed to send reply:`, error.message);
                }
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

function getMessageText(message) {
    if (message.message.conversation) {
        return message.message.conversation;
    }
    if (message.message.extendedTextMessage) {
        return message.message.extendedTextMessage.text;
    }
    if (message.message.imageMessage) {
        return message.message.imageMessage.caption || '[Image]';
    }
    if (message.message.videoMessage) {
        return message.message.videoMessage.caption || '[Video]';
    }
    return '[Media Message]';
}

async function notifyAdminsOnline(sock, connectionTime) {
    const onlineMessage = `🤖 *WhatsBixby - Session Activated!*\n\n✅ *Bot is now ONLINE!*\n\n📋 *Session ID:* ${ACTIVE_SESSION_ID}\n⏰ *Connection Time:* ${connectionTime}s\n🕒 *Started At:* ${new Date().toLocaleString()}\n\n📊 *Bot Features:*\n• Auto-reply system\n• Message logging\n• Admin notifications\n• 24/7 availability\n\n_The bot will now automatically respond to messages!_`;
    
    for (const admin of ADMINS) {
        try {
            await sock.sendMessage(admin, { 
                text: onlineMessage 
            });
            console.log(`📢 Online notification sent to admin: ${admin}`);
        } catch (error) {
            console.log(`❌ Failed to notify admin ${admin}:`, error.message);
        }
    }
}

async function notifyAdminsInteraction(sock, user, message) {
    // Only notify for significant interactions (not every message)
    if (message.length > 3 && !message.includes('hello') && !message.includes('hi')) {
        const interactionMessage = `📱 *New User Interaction*\n\n👤 *User:* ${user}\n💬 *Message:* ${message}\n\n🆔 *Session:* ${ACTIVE_SESSION_ID}\n⏰ *Time:* ${new Date().toLocaleTimeString()}`;
        
        for (const admin of ADMINS) {
            try {
                await sock.sendMessage(admin, { 
                    text: interactionMessage 
                });
            } catch (error) {
                console.log(`❌ Failed to send interaction notification to ${admin}`);
            }
        }
    }
}

// Web server setup
const pairRouter = require('./pair');

const web = () => {
    app.use(express.json());
    app.use(express.static('.')); // Serve static files
    
    app.get('/', (req, res) => res.sendFile(__dirname + '/pair.html'));
    app.use('/pair', pairRouter);
    
    // Bot status endpoint
    app.get('/status', (req, res) => res.json({ 
        status: 'online',
        bot: 'WhatsBixby 2025',
        sessionId: ACTIVE_SESSION_ID,
        activeSession: ACTIVE_SESSION_ID,
        timestamp: new Date(),
        features: ['auto-reply', 'admin-notifications', 'session-management']
    }));
    
    app.get('/health', (req, res) => res.json({ 
        status: 'online',
        bot: 'WhatsBixby 2025',
        session: ACTIVE_SESSION_ID,
        timestamp: new Date() 
    }));
    
    const server = app.listen(PORT, () => {
        console.log(`🌐 Web server running on port ${PORT}`);
        console.log(`🤖 WhatsBixby Bot initialized with session: ${ACTIVE_SESSION_ID}`);
        console.log(`📱 Admin notifications enabled for ${ADMINS.length} admins`);
        console.log(`💬 Auto-reply system: ACTIVE`);
    });
    
    process.on('SIGTERM', () => {
        server.close(() => {
            console.log('🌐 Web server closed');
            process.exit(0);
        });
    });
}

// Initialize and run the bot
const runBot = async () => {
    try {
        console.log('🚀 Starting WhatsBixby Bot...');
        console.log(`📋 Active Session: ${ACTIVE_SESSION_ID}`);
        
        // Connect to WhatsApp
        await connectToWhatsApp();
        
        // Start web server
        await web();
        
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
};

// Start the bot
runBot().catch(console.error);