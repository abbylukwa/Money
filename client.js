const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    try {
        console.log('🔄 Requesting WhatsApp pairing code for +263775156210...');
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: {
                ...state,
                phoneNumber: "+263775156210"
            },
            browser: Browsers.ubuntu('Chrome'),
            getMessage: async (key) => {
                return {
                    conversation: 'hello'
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        let connectionTimeout;
        let isConnected = false;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n🔐 WHATSAPP PAIRING CODE FOR +263775156210:');
                console.log('══════════════════════════════════════');
                console.log(`📱 PHONE: +263775156210`);
                console.log(`🔢 CODE: ${qr}`);
                console.log('══════════════════════════════════════');
                console.log('📱 On phone +263775156210, open WhatsApp');
                console.log('⚙️ Go to Settings → Linked Devices → Link a Device');
                console.log('🔢 Choose "Pair with code" and enter the code above');
                console.log('⏳ Waiting for connection...\n');
                
                clearTimeout(connectionTimeout);
                connectionTimeout = setTimeout(() => {
                    console.log('⏰ Pairing code expired. Requesting new code...');
                    sock.end(new Error('Pairing timeout'));
                    setTimeout(() => connectToWhatsApp(), 2000);
                }, 60000);
            }

            if (connection === 'close') {
                clearTimeout(connectionTimeout);
                isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                console.log('❌ Connection closed for +263775156210');
                if (shouldReconnect) {
                    console.log('🔄 Reconnecting in 5 seconds...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }

            if (connection === 'open') {
                clearTimeout(connectionTimeout);
                isConnected = true;
                console.log('✅ WhatsApp Connected Successfully for +263775156210!');
                console.log('🤖 Bot is now ready to receive messages...');
                
                setTimeout(async () => {
                    try {
                        const botJid = sock.user.id;
                        await sock.sendMessage(botJid, { 
                            text: '🤖 WhatsApp Bot Connected!\nNumber: +263775156210\nStatus: Online and Ready' 
                        });
                        console.log('✅ Self-test message sent to +263775156210');
                    } catch (error) {
                        console.log('❌ Self-test failed:', error.message);
                    }
                }, 2000);
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected) {
                return;
            }

            const msg = m.messages[0];
            if (!msg.message) {
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
                        await sock.sendMessage(sender, { text: '🏓 Pong! - Bot +263775156210' });
                    } else if (lowercaseText === 'hello' || lowercaseText === 'hi') {
                        await sock.sendMessage(sender, { 
                            text: '👋 Hello! I am WhatsApp Bot +263775156210. How can I help you?' 
                        });
                    } else if (lowercaseText === 'menu') {
                        await sock.sendMessage(sender, { 
                            text: '📱 *BOT MENU - +263775156210*\n\n' +
                            '• ping - Test response\n' +
                            '• hello - Greeting\n' +
                            '• menu - Show this menu\n' +
                            '• status - Bot status\n' +
                            '• time - Current time'
                        });
                    } else if (lowercaseText === 'status') {
                        await sock.sendMessage(sender, { 
                            text: `🤖 *BOT STATUS*\n\n` +
                            `📱 Number: +263775156210\n` +
                            `✅ Online: Yes\n` +
                            `🕒 Time: ${new Date().toLocaleString()}\n` +
                            `📱 Platform: WhatsApp Web`
                        });
                    } else if (lowercaseText === 'time') {
                        await sock.sendMessage(sender, { 
                            text: `🕒 Current time: ${new Date().toLocaleString()}`
                        });
                    } else {
                        await sock.sendMessage(sender, { 
                            text: `✅ Message received by +263775156210: "${text}"\n\nType "menu" to see available commands.`
                        });
                    }
                } else if (messageType === 'imageMessage') {
                    await sock.sendMessage(sender, { 
                        text: '📸 Image received by +263775156210! Thank you.'
                    });
                } else if (messageType === 'videoMessage') {
                    await sock.sendMessage(sender, { 
                        text: '🎥 Video received by +263775156210! Thank you.'
                    });
                } else if (messageType === 'audioMessage') {
                    await sock.sendMessage(sender, { 
                        text: '🎵 Audio received by +263775156210! Thank you.'
                    });
                }
            } catch (error) {
                console.log('❌ Error sending message:', error.message);
            }
        });

        return sock;

    } catch (error) {
        console.error('❌ Connection error for +263775156210:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

const web = () => {
    app.get('/', (req, res) => res.send('🤖 WhatsApp Bot - Active & Running - Number: +263775156210'));
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