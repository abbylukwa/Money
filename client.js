const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    try {
        console.log('🔄 Connecting to WhatsApp...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: true, // This shows the actual QR code that contains the pairing data
            auth: state,
            browser: Browsers.ubuntu('Chrome')
        });

        sock.ev.on('creds.update', saveCreds);

        let connected = false;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !connected) {
                console.log('\n📱 TO GET PAIRING CODE:');
                console.log('1. Scan this QR code with WhatsApp');
                console.log('2. OR Use WhatsApp Web pairing feature');
                console.log('3. Wait for connection...\n');
            }

            if (connection === 'open') {
                connected = true;
                console.log('✅ WhatsApp Connected Successfully!');
                console.log('🤖 Bot is now ready to receive messages...');
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
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
    app.get('/', (req, res) => res.send('🤖 WhatsApp Bot - Active'));
    app.listen(PORT, () => console.log(`🌐 Web server on port ${PORT}`));
}

class WhatsApp {
    async connect() {
        return await connectToWhatsApp();
    }

    async web() {
        return web();
    }
}

module.exports = WhatsApp;