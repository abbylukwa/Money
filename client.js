const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    try {
        console.log('🔄 Starting WhatsApp connection for Abners Bot 2025...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: false // Disable built-in QR to use our custom one
        });

        sock.ev.on('creds.update', saveCreds);

        let qrDisplayed = false;
        let connectionTimeout;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Clear any existing timeout
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
            }

            if (qr && !qrDisplayed) {
                qrDisplayed = true;
                console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP:\n');
                qrcode.generate(qr, { small: true });
                console.log('\n⏳ QR Code generated. Please scan within 30 seconds...');
                
                // Set timeout to regenerate QR if not scanned
                connectionTimeout = setTimeout(() => {
                    if (connection !== 'open') {
                        console.log('🔄 QR code expired, regenerating...');
                        qrDisplayed = false;
                    }
                }, 30000);
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp Connected Successfully!');
                console.log('🤖 Bot is now ready to receive messages...');
                qrDisplayed = true; // Prevent further QR displays
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    console.log('🔄 Attempting to reconnect...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }
        });

        return sock;

    } catch (error) {
        console.error('❌ Connection error:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

const web = () => {
    app.get('/', (req, res) => res.send('🤖 Abners Bot 2025 - Active & Running'));
    app.get('/health', (req, res) => res.json({ 
        status: 'online',
        bot: 'Abners Bot 2025',
        timestamp: new Date() 
    }));
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
