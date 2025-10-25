const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

const ADMINS = [
    '263717457592@s.whatsapp.net',
    '263777627210@s.whatsapp.net', 
    '27614159817@s.whatsapp.net'
];

process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, cleaning up...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT, shutting down...');
    process.exit(0);
});

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: false
        });

        sock.ev.on('creds.update', saveCreds);

        let qrDisplayed = false;
        let isConnected = false;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !qrDisplayed) {
                qrDisplayed = true;
                console.clear();
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'open' && !isConnected) {
                isConnected = true;
                console.clear();
                console.log('✅ WhatsApp Connected!');
                notifyAdminsOnline(sock);
            }

            if (connection === 'close') {
                console.clear();
                console.log('❌ Connection closed');
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
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
            
            console.log(`📨 Message from ${user}: ${getMessageText(message)}`);
            
            if (message.message.conversation || message.message.extendedTextMessage) {
                const text = getMessageText(message).toLowerCase();
                
                if (text === 'ping') {
                    await sock.sendMessage(jid, { text: '🏓 Pong!' });
                }
                
                if (text === '!status') {
                    await sock.sendMessage(jid, { text: '🤖 Bot is online and running!' });
                }
            }
        });

        return sock;

    } catch (error) {
        console.clear();
        console.log('❌ Connection error, reconnecting...');
        setTimeout(() => connectToWhatsApp(), 5000);
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
    return '[Media Message]';
}

async function notifyAdminsOnline(sock) {
    const onlineMessage = '🤖 *Bot Status Update*\n\n✅ Bot is now online and ready!\n\n*Connection Time:* ' + new Date().toLocaleString();
    
    for (const admin of ADMINS) {
        try {
            await sock.sendMessage(admin, { 
                text: onlineMessage 
            });
            console.log(`📢 Online notification sent to: ${admin}`);
        } catch (error) {
            console.log(`❌ Failed to notify admin ${admin}:`, error.message);
        }
    }
}

const web = () => {
    app.get('/', (req, res) => res.send('🤖 Abners Bot 2025 - Active & Running'));
    app.get('/health', (req, res) => res.json({ 
        status: 'online',
        bot: 'Abners Bot 2025',
        timestamp: new Date() 
    }));
    
    const server = app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
    
    process.on('SIGTERM', () => {
        server.close(() => {
            console.log('🌐 Web server closed');
            process.exit(0);
        });
    });
}

class WhatsApp {
    async connect() {
        this.conn = await connectToWhatsApp();
        return this.conn;
    }

    async web() {
        return web();
    }
}

module.exports = WhatsApp;