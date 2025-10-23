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

        let connectionTimeout;
        let isConnected = false;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                const pairingCode = extractPairingCode(qr);
                
                console.log('\n🔐 WHATSAPP PAIRING CODE:');
                console.log('══════════════════════════════════════');
                console.log(`📱 CODE: ${pairingCode}`);
                console.log('══════════════════════════════════════');
                console.log('📱 Open WhatsApp → Settings → Linked Devices → Link a Device');
                console.log('🔢 Choose "Pair with code" and enter the code above');
                console.log('⏳ Waiting for connection...\n');
                
                clearTimeout(connectionTimeout);
                connectionTimeout = setTimeout(() => {
                    console.log('⏰ Pairing code expired. Restarting...');
                    sock.end(new Error('Pairing timeout'));
                }, 60000);
            }

            if (connection === 'close') {
                clearTimeout(connectionTimeout);
                isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                console.log('❌ Connection closed');
                if (shouldReconnect) {
                    console.log('🔄 Reconnecting in 5 seconds...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }

            if (connection === 'open') {
                clearTimeout(connectionTimeout);
                isConnected = true;
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
            if (!isConnected) {
                return;
            }

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
                            text: '👋 Hello! I am a WhatsApp Bot. How can I help you?' 
                        });
                    } else if (lowercaseText === 'menu') {
                        await sock.sendMessage(sender, { 
                            text: '📱 *BOT MENU*\n\n' +
                            '• ping - Test response\n' +
                            '• hello - Greeting\n' +
                            '• menu - Show this menu\n' +
                            '• status - Bot status\n' +
                            '• time - Current time'
                        });
                    } else if (lowercaseText === 'status') {
                        await sock.sendMessage(sender, { 
                            text: `🤖 *BOT STATUS*\n\n` +
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
                            text: `✅ Message received: "${text}"\n\nType "menu" to see available commands.`
                        });
                    }
                } else if (messageType === 'imageMessage') {
                    await sock.sendMessage(sender, { 
                        text: '📸 Image received! Thank you.'
                    });
                } else if (messageType === 'videoMessage') {
                    await sock.sendMessage(sender, { 
                        text: '🎥 Video received! Thank you.'
                    });
                } else if (messageType === 'audioMessage') {
                    await sock.sendMessage(sender, { 
                        text: '🎵 Audio received! Thank you.'
                    });
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

function extractPairingCode(qrData) {
    try {
        if (!qrData) {
            return 'NO-CODE';
        }
        
        const parts = qrData.split(',');
        if (parts.length === 0) {
            return 'NO-CODE';
        }
        
        const firstPart = parts[0];
        
        const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
        if (base64Regex.test(firstPart)) {
            try {
                const decoded = Buffer.from(firstPart, 'base64').toString('utf-8');
                const numericMatch = decoded.match(/\d{6,8}/);
                if (numericMatch) {
                    return numericMatch[0];
                }
            } catch (e) {
            }
        }
        
        const numericMatch = qrData.match(/\d{6,8}/);
        if (numericMatch) {
            return numericMatch[0];
        }
        
        const alphanumericMatch = qrData.match(/[A-Z0-9]{6,8}/gi);
        if (alphanumericMatch) {
            return alphanumericMatch[0].toUpperCase();
        }
        
        let code = '';
        for (let i = 0; i < Math.min(qrData.length, 8); i++) {
            const char = qrData[i];
            if (/[A-Z0-9]/i.test(char)) {
                code += char.toUpperCase();
            }
            if (code.length >= 6) break;
        }
        
        return code || 'CODE-ERR';
    } catch (error) {
        return 'ERROR';
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