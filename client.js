const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    try {
        console.log('🔄 Initializing WhatsApp connection...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            getMessage: async (key) => {
                return {
                    conversation: 'hello'
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        let pairingCodeShown = false;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !pairingCodeShown) {
                pairingCodeShown = true;
                
                console.log('\n🔐 WHATSAPP PAIRING CODE:');
                console.log('══════════════════════════════════════');
                console.log(`📱 CODE: ${qr}`);
                console.log('══════════════════════════════════════');
                console.log('📱 Open WhatsApp → Settings → Linked Devices → Link a Device');
                console.log('🔢 Choose "Pair with code" and enter the code above');
                console.log('⏳ Waiting for connection...\n');
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                console.log('❌ Connection closed');
                if (shouldReconnect) {
                    console.log('🔄 Reconnecting...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp Connected Successfully!');
                console.log('🤖 Bot is now ready to receive messages...');
                
                setTimeout(async () => {
                    try {
                        const botJid = sock.user.id;
                        await sock.sendMessage(botJid, { 
                            text: '🤖 WhatsApp Bot Connected!\nStatus: Online and Ready' 
                        });
                        console.log('✅ Self-test message sent');
                    } catch (error) {
                        console.log('❌ Self-test failed:', error.message);
                    }
                }, 2000);
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) {
                return;
            }

            const sender = msg.key.remoteJid;
            const messageType = Object.keys(msg.message)[0];
            let text = '';

            if (messageType === 'conversation') {
                text = msg.message.conversation;
            } else if (messageType === 'extendedTextMessage') {
                text = msg.message.extendedTextMessage.text;
            }

            console.log(`📩 Message from ${sender}: ${text}`);

            try {
                if (text) {
                    const lowercaseText = text.toLowerCase();
                    
                    if (lowercaseText === 'ping') {
                        await sock.sendMessage(sender, { text: '🏓 Pong!' });
                    } else if (lowercaseText === 'hello' || lowercaseText === 'hi') {
                        await sock.sendMessage(sender, { 
                            text: '👋 Hello! I am a WhatsApp Bot.' 
                        });
                    } else {
                        await sock.sendMessage(sender, { 
                            text: '✅ Message received!' 
                        });
                    }
                }
            } catch (error) {
                console.log('❌ Error sending message:', error.message);
            }
        });

        return sock;

    } catch (error) {
        console.error('❌ Connection error:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

const web = () => {
    app.get('/', (req, res) => res.send('🤖 WhatsApp Bot - Active & Running'));
    app.get('/health', (req, res) => res.json({ 
        status: 'online',
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