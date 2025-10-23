const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    try {
        console.log('🔄 Requesting WhatsApp pairing code...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.ubuntu('Chrome')
        });

        sock.ev.on('creds.update', saveCreds);

        let pairingCodeDisplayed = false;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !pairingCodeDisplayed) {
                pairingCodeDisplayed = true;
                
                // This is the actual pairing code from WhatsApp
                console.log('\n🔐 WHATSAPP PAIRING CODE:');
                console.log('══════════════════════════════════════');
                console.log(`📱 ${qr}`);
                console.log('══════════════════════════════════════');
                console.log('📱 On your phone:');
                console.log('1. Open WhatsApp');
                console.log('2. Go to Settings → Linked Devices → Link a Device');
                console.log('3. Tap "Pair with code"');
                console.log('4. Enter the code above');
                console.log('⏳ Waiting for connection...\n');
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp Connected Successfully!');
                console.log('🤖 Bot is now ready to receive messages...');
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    console.log('🔄 Reconnecting...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const sender = msg.key.remoteJid;
            console.log(`📩 Message received from: ${sender}`);
        });

        return sock;

    } catch (error) {
        console.error('❌ Connection error:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

const web = () => {
    app.get('/', (req, res) => res.send('🤖 WhatsApp Bot - Waiting for Pairing'));
    app.get('/health', (req, res) => res.json({ 
        status: 'waiting_for_pairing',
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