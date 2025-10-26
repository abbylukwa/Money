const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const { PORT } = require("./config");

// Store active sessions
const activeSessions = new Map();

// Admin configuration
const ADMINS = [
    '263717457592@s.whatsapp.net',
    '263777627210@s.whatsapp.net', 
    '27614159817@s.whatsapp.net'
];

// Auto-reply configuration
const AUTO_REPLIES = {
    'hello': '👋 Hello! How can I help you today?',
    'hi': '👋 Hi there! What can I do for you?',
    'ping': '🏓 Pong!',
    '!status': '🤖 WhatsBixby is online and running!',
    'menu': '📱 *Available Commands:*\n• hello/hi - Greeting\n• ping - Check bot status\n• !status - Bot status\n• menu - Show this menu',
    'default': '🤖 I am WhatsBixby bot. Use "menu" to see available commands.'
};

// Process management
process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, cleaning up...');
    cleanupSessions();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT, shutting down...');
    cleanupSessions();
    process.exit(0);
});

function cleanupSessions() {
    console.log('🧹 Cleaning up active sessions...');
    activeSessions.forEach((session, sessionId) => {
        console.log(`Closing session: ${sessionId}`);
    });
    activeSessions.clear();
}

// Generate unique session ID
function generateSessionId() {
    return 'WB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize WhatsApp connection for a session
async function initializeWhatsAppSession(sessionId, sessionPath) {
    try {
        console.log(`🔗 Initializing WhatsApp session: ${sessionId}`);
        
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
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

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection === 'open' && !isConnected) {
                isConnected = true;
                console.log(`✅ WhatsApp Connected for session: ${sessionId}`);
                notifyAdminsOnline(sock, sessionId);
            }

            if (connection === 'close') {
                console.log(`❌ Connection closed for session: ${sessionId}`);
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    setTimeout(() => initializeWhatsAppSession(sessionId, sessionPath), 5000);
                } else {
                    // Remove session from active sessions
                    activeSessions.delete(sessionId);
                }
            }
        });

        // Message handling
        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected) return;
            
            const message = m.messages[0];
            if (message.key.fromMe || !message.message) return;

            const jid = message.key.remoteJid;
            const user = message.pushName || 'Unknown';
            const text = getMessageText(message).toLowerCase().trim();
            
            console.log(`📨 [${sessionId}] Message from ${user}: ${text}`);
            
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
                    console.log(`✅ [${sessionId}] Auto-reply sent to ${user}`);
                } catch (error) {
                    console.error(`❌ [${sessionId}] Failed to send reply:`, error.message);
                }
            }
        });

        // Store session
        activeSessions.set(sessionId, {
            sock: sock,
            path: sessionPath,
            connected: isConnected
        });

        return sock;

    } catch (error) {
        console.error(`❌ Error initializing session ${sessionId}:`, error);
        // Remove failed session
        activeSessions.delete(sessionId);
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

async function notifyAdminsOnline(sock, sessionId) {
    const onlineMessage = `🤖 *WhatsBixby Status Update*\n\n✅ New session activated!\n\n*Session ID:* ${sessionId}\n*Connection Time:* ${new Date().toLocaleString()}\n\nBot is now online and ready to receive messages!`;
    
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

// Load existing sessions on startup
async function loadExistingSessions() {
    const sessionsDir = './sessions';
    if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
        return;
    }

    const sessionDirs = fs.readdirSync(sessionsDir);
    
    for (const dir of sessionDirs) {
        if (dir.startsWith('WB_')) {
            const sessionPath = path.join(sessionsDir, dir);
            const credsPath = path.join(sessionPath, 'creds.json');
            
            if (fs.existsSync(credsPath)) {
                console.log(`🔄 Loading existing session: ${dir}`);
                await initializeWhatsAppSession(dir, sessionPath);
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
    
    // Session management endpoints
    app.get('/sessions', (req, res) => {
        const sessions = Array.from(activeSessions.entries()).map(([id, data]) => ({
            id,
            connected: data.connected,
            path: data.path
        }));
        res.json({ sessions });
    });
    
    app.get('/health', (req, res) => res.json({ 
        status: 'online',
        bot: 'WhatsBixby 2025',
        activeSessions: activeSessions.size,
        timestamp: new Date() 
    }));
    
    const server = app.listen(PORT, () => {
        console.log(`🌐 Web server running on port ${PORT}`);
        console.log(`🤖 WhatsBixby Bot initialized`);
        console.log(`📱 Active sessions: ${activeSessions.size}`);
    });
    
    process.on('SIGTERM', () => {
        server.close(() => {
            console.log('🌐 Web server closed');
            cleanupSessions();
            process.exit(0);
        });
    });
}

class WhatsAppManager {
    async initialize() {
        // Load existing sessions
        await loadExistingSessions();
        return this;
    }

    async web() {
        return web();
    }

    // Method to add new session
    async addSession(sessionId, sessionPath) {
        return await initializeWhatsAppSession(sessionId, sessionPath);
    }

    // Method to remove session
    removeSession(sessionId) {
        if (activeSessions.has(sessionId)) {
            activeSessions.delete(sessionId);
            console.log(`🗑️ Session removed: ${sessionId}`);
            return true;
        }
        return false;
    }

    getActiveSessions() {
        return Array.from(activeSessions.keys());
    }
}

// Initialize and run the bot
const runBot = async () => {
    const waManager = new WhatsAppManager();
    await waManager.initialize();
    await waManager.web();
};

runBot().catch(console.error);

// Export for use in other files
module.exports = { WhatsAppManager, generateSessionId };