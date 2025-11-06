const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys");
const fs = require("fs");
const pino = require("pino");
const { ADMINS, BOT_NUMBER } = require("./config");
const { handleCommand, getMessageText } = require("./handler");
const { logToTerminal } = require("./print");

let sock = null;
let isConnected = false;
let pairingCode = null;
let connectionResolve = null;
let connectionPromise = new Promise((resolve) => {
    connectionResolve = resolve;
});

async function connectToWhatsApp() {
    try {
        logToTerminal('🔗 Initializing WhatsApp connection...');
        logToTerminal(`📞 Bot Number: ${BOT_NUMBER}`);
        
        // Use session file authentication
        const { state, saveCreds } = await useMultiFileAuthState('./sessions');
        const { version } = await fetchLatestBaileysVersion();

        const connectionOptions = {
            version,
            logger: pino({ level: "silent" }),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false,
            printQRInTerminal: false
        };

        sock = makeWASocket(connectionOptions);
        sock.ev.on('creds.update', saveCreds);
        logToTerminal('✅ Session authentication initialized');

        let connectionStartTime = Date.now();

        // Generate real pairing code if not registered
        if (!state.creds.registered) {
            try {
                logToTerminal('🔄 Generating real pairing code...');
                pairingCode = await sock.requestPairingCode(BOT_NUMBER.replace(/[^0-9]/g, ''));
                
                logToTerminal('\n🎯 ================================');
                logToTerminal(`🎯 REAL PAIRING CODE: ${pairingCode}`);
                logToTerminal('🎯 ================================');
                logToTerminal('📱 Use this REAL code in WhatsApp');
                logToTerminal('📱 This will connect your actual WhatsApp account');
                logToTerminal('⏳ Waiting for you to enter the pairing code in WhatsApp...');
                logToTerminal('====================================\n');
                
            } catch (error) {
                logToTerminal(`❌ Failed to generate pairing code: ${error.message}`);
                logToTerminal('🔄 Retrying in 10 seconds...');
                setTimeout(() => connectToWhatsApp(), 10000);
                return;
            }
        } else {
            logToTerminal('✅ Using existing session, no pairing code needed');
        }

        // Connection event handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            // Handle successful connection
            if (connection === 'open' && !isConnected) {
                isConnected = true;
                pairingCode = null;
                
                const connectionTime = Math.round((Date.now() - connectionStartTime) / 1000);
                logToTerminal('\n🎉 WhatsApp Connected Successfully!');
                logToTerminal(`⏰ Connection established in ${connectionTime} seconds`);
                
                const user = sock.user;
                logToTerminal(`👤 Connected as: ${user.name || user.id}`);
                logToTerminal(`📱 Phone: ${user.id}`);
                
                // Resolve the connection promise
                if (connectionResolve) {
                    connectionResolve(sock);
                    connectionResolve = null;
                }
                
                await sendOnlineNotification();
            }

            // Handle connection close
            if (connection === 'close') {
                logToTerminal('❌ WhatsApp connection closed');
                isConnected = false;
                pairingCode = null;
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    logToTerminal('🔄 Attempting to reconnect in 5 seconds...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                } else {
                    logToTerminal('❌ Device logged out. Cleaning up...');
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
            
            logToTerminal(`📨 Message from ${user} (${isAdmin ? 'Admin' : 'User'}): ${text}`);
            
            if (!isAdmin) {
                logToTerminal('🚫 Ignoring message from non-admin user');
                return;
            }
            
            let reply = await handleCommand(jid, text, sock, isConnected);
            
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

// Send online notification to admins
async function sendOnlineNotification() {
    if (!sock || !isConnected) return;
    
    const onlineMessage = `🤖 *Knight Bot - Online!*

✅ *Your WhatsApp bot is now connected and ready!*

✨ *Features Active:*
• Auto-reply to admin messages
• Real WhatsApp connection
• 24/7 operation

🌐 *System Information:*
• Bot Number: ${BOT_NUMBER}
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

function getConnectionStatus() {
    return { isConnected, pairingCode };
}

function waitForConnection() {
    return connectionPromise;
}

module.exports = { connectToWhatsApp, getConnectionStatus, waitForConnection };
