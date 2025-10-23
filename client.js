const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const qrcode = require("qrcode-terminal");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    try {
        console.log('🔄 Initializing WhatsApp connection...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const conn = makeWASocket({
            version,
            logger: pino({ level: "error" }), // Changed from "silent" to "error"
            browser: Browsers.ubuntu('Chrome'),
            auth: state,
            printQRInTerminal: true,
            syncFullHistory: false,
            markOnlineOnConnect: true, // Changed to true
            generateHighQualityLinkPreview: true,
            emitOwnEvents: true,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000
        });

        conn.ev.on('creds.update', saveCreds);

        conn.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log('🔗 Connection update:', connection);

            if (qr) {
                console.log('🔐 Scan QR Code with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                console.log('❌ Connection closed:', lastDisconnect?.error);
                console.log('🔄 Reconnecting in 5 seconds...');
                if (shouldReconnect) {
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp Connected Successfully!');
                console.log('📱 Bot is ready to receive messages...');
            }
        });

        // Test message reception
        conn.ev.on('messages.upsert', async ({ messages, type }) => {
            console.log('📩 RAW MESSAGE RECEIVED:', type);
            console.log('Message count:', messages.length);
            
            if (messages[0]) {
                const message = messages[0];
                console.log('From:', message.key.remoteJid);
                console.log('Message type:', Object.keys(message.message || {}));
            }
        });

        return conn;

    } catch (error) {
        console.error('❌ Connection error:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

const web = () => {
    app.get('/', (req, res) => res.send('🤖 Abner Bot - Active & Running 2025'));
    app.get('/health', (req, res) => res.json({ status: 'online', timestamp: new Date() }));
    app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
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
