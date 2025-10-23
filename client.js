const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

class WhatsApp {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.targetPhoneNumber = null;
        this.connectionTimeout = null;
        this.isWaitingForPairing = false;
    }

    async connect() {
        try {
            console.log('🔄 WhatsApp Bot Initializing...');
            console.log('💡 Send "pair 0775156210" to start pairing with a number');
            
            const { state, saveCreds } = await useMultiFileAuthState('./session');
            const { version } = await fetchLatestBaileysVersion();

            this.sock = makeWASocket({
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

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr && this.isWaitingForPairing) {
                    console.log('\n🔐 WHATSAPP PAIRING CODE:');
                    console.log('══════════════════════════════════════');
                    console.log(`📱 PHONE: ${this.targetPhoneNumber}`);
                    console.log(`🔢 CODE: ${qr}`);
                    console.log('══════════════════════════════════════');
                    console.log(`📱 On phone ${this.targetPhoneNumber}, open WhatsApp`);
                    console.log('⚙️ Go to Settings → Linked Devices → Link a Device');
                    console.log('🔢 Choose "Pair with code" and enter the code above');
                    console.log('⏳ Waiting for connection...\n');
                    
                    clearTimeout(this.connectionTimeout);
                    this.connectionTimeout = setTimeout(() => {
                        console.log('⏰ Pairing code expired. Use "pair" command again.');
                        this.isWaitingForPairing = false;
                        this.sock.end(new Error('Pairing timeout'));
                    }, 60000);
                }

                if (connection === 'close') {
                    clearTimeout(this.connectionTimeout);
                    this.isConnected = false;
                    this.isWaitingForPairing = false;
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                    console.log('❌ Connection closed');
                    if (shouldReconnect) {
                        console.log('🔄 Reconnecting in 5 seconds...');
                        setTimeout(() => this.connect(), 5000);
                    }
                }

                if (connection === 'open') {
                    clearTimeout(this.connectionTimeout);
                    this.isConnected = true;
                    this.isWaitingForPairing = false;
                    console.log('✅ WhatsApp Connected Successfully!');
                    console.log('🤖 Bot is now ready to receive messages...');
                    
                    setTimeout(async () => {
                        try {
                            const botJid = this.sock.user.id;
                            await this.sock.sendMessage(botJid, { 
                                text: `🤖 WhatsApp Bot Connected!\nNumber: ${this.targetPhoneNumber || 'Not specified'}\nStatus: Online and Ready` 
                            });
                            console.log('✅ Self-test message sent');
                        } catch (error) {
                            console.log('❌ Self-test failed:', error.message);
                        }
                    }, 2000);
                }
            });

            this.sock.ev.on('messages.upsert', async (m) => {
                if (!this.isConnected) {
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
                        const lowercaseText = text.toLowerCase().trim();
                        
                        if (lowercaseText.startsWith('pair ')) {
                            const phoneNumber = text.split(' ')[1];
                            if (phoneNumber) {
                                await this.startPairing(phoneNumber, sender);
                            } else {
                                await this.sock.sendMessage(sender, { 
                                    text: '❌ Please provide a phone number. Usage: pair 0775156210' 
                                });
                            }
                        } else if (lowercaseText === 'pair') {
                            await this.sock.sendMessage(sender, { 
                                text: '❌ Please provide a phone number. Usage: pair 0775156210' 
                            });
                        } else if (lowercaseText === 'ping') {
                            await this.sock.sendMessage(sender, { text: '🏓 Pong!' });
                        } else if (lowercaseText === 'hello' || lowercaseText === 'hi') {
                            await this.sock.sendMessage(sender, { 
                                text: '👋 Hello! I am a WhatsApp Bot. Send "pair 0775156210" to start pairing.' 
                            });
                        } else if (lowercaseText === 'menu') {
                            await this.sock.sendMessage(sender, { 
                                text: '📱 *BOT MENU*\n\n' +
                                '• pair 0775156210 - Start pairing with number\n' +
                                '• ping - Test response\n' +
                                '• hello - Greeting\n' +
                                '• menu - Show this menu\n' +
                                '• status - Bot status'
                            });
                        } else if (lowercaseText === 'status') {
                            await this.sock.sendMessage(sender, { 
                                text: `🤖 *BOT STATUS*\n\n` +
                                `✅ Online: ${this.isConnected ? 'Yes' : 'No'}\n` +
                                `📱 Target Number: ${this.targetPhoneNumber || 'Not set'}\n` +
                                `🔄 Pairing: ${this.isWaitingForPairing ? 'Waiting...' : 'No'}\n` +
                                `🕒 Time: ${new Date().toLocaleString()}`
                            });
                        } else {
                            await this.sock.sendMessage(sender, { 
                                text: `✅ Message received. Send "pair 0775156210" to start pairing with a number.\n\nType "menu" for commands.`
                            });
                        }
                    } else if (messageType === 'imageMessage') {
                        await this.sock.sendMessage(sender, { 
                            text: '📸 Image received! Send "pair 0775156210" to start pairing.'
                        });
                    }
                } catch (error) {
                    console.log('❌ Error sending message:', error.message);
                }
            });

            return this.sock;

        } catch (error) {
            console.error('❌ Connection error:', error);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async startPairing(phoneNumber, sender) {
        try {
            this.targetPhoneNumber = phoneNumber;
            this.isWaitingForPairing = true;
            
            console.log(`🔄 Starting pairing process for: ${phoneNumber}`);
            
            await this.sock.sendMessage(sender, { 
                text: `🔄 Starting pairing process for: ${phoneNumber}\n\nPlease wait for the pairing code...` 
            });

            this.sock.ev.emit('connection.update', { 
                qr: `pairing_requested_${phoneNumber}`,
                connection: 'connecting'
            });

        } catch (error) {
            console.log('❌ Error starting pairing:', error.message);
            await this.sock.sendMessage(sender, { 
                text: `❌ Error starting pairing: ${error.message}` 
            });
        }
    }

    async web() {
        app.get('/', (req, res) => res.send('🤖 WhatsApp Bot - Active & Running - Send "pair 0775156210" to start'));
        app.get('/health', (req, res) => res.json({ 
            status: 'online',
            pairing: this.isWaitingForPairing,
            targetNumber: this.targetPhoneNumber,
            timestamp: new Date() 
        }));
        app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
    }
}

module.exports = WhatsApp;