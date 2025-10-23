const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const qrcode = require("qrcode-terminal");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    try {
        console.log('🔄 Initializing WhatsApp connection for +263775156210...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const conn = makeWASocket({
            version,
            logger: pino({ level: "error" }),
            browser: Browsers.ubuntu('Chrome'),
            auth: state,
            printQRInTerminal: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            emitOwnEvents: true,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000
        });

        conn.ev.on('creds.update', saveCreds);

        let connectionTimeout;

        conn.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr, isNewLogin, receivedPendingNotifications } = update;

            console.log('🔗 Connection state:', connection);

            if (qr) {
                console.log('\n🔐 WHATSAPP PAIRING CODE FOR +263775156210:');
                console.log('══════════════════════════════════════');
                qrcode.generate(qr, { small: true });
                console.log('══════════════════════════════════════');
                console.log('📱 Open WhatsApp on your phone with number +263775156210');
                console.log('⚙️ Go to Settings → Linked Devices → Link a Device');
                console.log('📷 Scan the QR code above to pair this bot');
                console.log('⏳ Waiting for connection...\n');
                
                clearTimeout(connectionTimeout);
                connectionTimeout = setTimeout(() => {
                    console.log('⏰ QR code expired. Restarting connection...');
                    conn.end(new Error('QR timeout'));
                }, 60000);
            }

            if (isNewLogin) {
                console.log('🔄 New login detected for +263775156210');
            }

            if (receivedPendingNotifications) {
                console.log('📥 Pending notifications received');
            }

            if (connection === 'close') {
                clearTimeout(connectionTimeout);
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                console.log('❌ Connection closed for +263775156210');
                console.log('🔄 Reconnecting in 5 seconds...');
                if (shouldReconnect) {
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }

            if (connection === 'open') {
                clearTimeout(connectionTimeout);
                console.log('✅ WhatsApp Connected Successfully for +263775156210!');
                console.log('🤖 Bot is now ready to receive messages...');
                
                setTimeout(async () => {
                    try {
                        const botJid = conn.user.id;
                        await conn.sendMessage(botJid, { 
                            text: '🤖 Abner Bot Connected!\nNumber: +263775156210\nStatus: Online and Ready' 
                        });
                        console.log('✅ Self-test message sent to +263775156210');
                    } catch (error) {
                        console.log('❌ Self-test failed:', error.message);
                    }
                }, 2000);
            }
        });

        conn.ev.on('messages.upsert', async ({ messages, type }) => {
            console.log('📩 Message received on +263775156210:', type);
            
            if (messages[0]) {
                const message = messages[0];
                console.log('From:', message.key.remoteJid);
                console.log('Message type:', Object.keys(message.message || {}));
            }
        });

        return conn;

    } catch (error) {
        console.error('❌ Connection error for +263775156210:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

const web = () => {
    app.get('/', (req, res) => res.send('🤖 Abner Bot - Active & Running 2025 - Number: +263775156210'));
    app.get('/health', (req, res) => res.json({ 
        status: 'online', 
        number: '+263775156210',
        timestamp: new Date() 
    }));
    app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT} for +263775156210`));
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
