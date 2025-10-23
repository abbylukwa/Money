const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");
const KeepAlive = require("./keepAlive"); // Your KeepAlive class

class WhatsApp {
    constructor() {
        this.keepAlive = new KeepAlive();
        this.isConnected = false;
        this.qrDisplayed = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
    }

    async connect() {
        try {
            this.connectionAttempts++;
            console.log(`🔄 WhatsApp connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}...`);
            
            const { state, saveCreds } = await useMultiFileAuthState('./session');
            const { version } = await fetchLatestBaileysVersion();

            this.conn = makeWASocket({
                version,
                logger: pino({ level: "silent" }),
                auth: state,
                browser: Browsers.ubuntu('Chrome'),
                printQRInTerminal: false
            });

            this.conn.ev.on('creds.update', saveCreds);

            this.conn.ev.on('connection.update', (update) => {
                this.handleConnectionUpdate(update);
            });

            // Start process keep-alive immediately
            this.startProcessKeepAlive();

            return this.conn;

        } catch (error) {
            console.error('❌ Connection error:', error);
            
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                console.log('🔄 Retrying connection in 5 seconds...');
                setTimeout(() => this.connect(), 5000);
            } else {
                console.log('❌ Max connection attempts reached. Please check your setup.');
            }
        }
    }

    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !this.qrDisplayed) {
            this.qrDisplayed = true;
            console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n⏳ Waiting for QR scan... (Container will stay alive)');
            
            // Reset connection attempts when QR is shown
            this.connectionAttempts = 0;
            
            // Extended timeout for QR scanning
            this.startQRTimeout();
        }

        if (connection === 'open') {
            this.isConnected = true;
            console.log('✅ WhatsApp Connected Successfully!');
            console.log('🤖 Bot is now ready to receive messages...');
            
            // Start web server and keep-alive pings after connection
            this.startWebServer();
            this.startKeepAlivePings();
        }

        if (connection === 'close') {
            console.log('❌ Connection closed');
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            
            if (shouldReconnect && this.connectionAttempts < this.maxConnectionAttempts) {
                console.log('🔄 Attempting to reconnect...');
                this.isConnected = false;
                this.qrDisplayed = false;
                setTimeout(() => this.connect(), 5000);
            } else {
                console.log('❌ Max reconnection attempts reached or invalid session.');
            }
        }
    }

    startProcessKeepAlive() {
        // This keeps the Node.js process from exiting
        console.log('💓 Starting process keep-alive...');
        
        const heartbeat = setInterval(() => {
            if (!this.isConnected) {
                console.log('⏰ Still waiting for WhatsApp connection...');
            } else {
                clearInterval(heartbeat);
            }
        }, 30000); // Log every 30 seconds

        // Prevent immediate exit
        process.stdin.resume();

        // Handle container signals gracefully
        process.on('SIGTERM', () => {
            console.log('📦 Received SIGTERM, but keeping alive for authentication...');
        });

        process.on('SIGINT', () => {
            console.log('📦 Received SIGINT, but keeping alive for authentication...');
        });
    }

    startQRTimeout() {
        // Give user 3 minutes to scan QR code
        setTimeout(() => {
            if (!this.isConnected) {
                console.log('\n⚠️  QR Code timeout approaching...');
                console.log('🔄 If not scanned, the QR will refresh soon...');
            }
        }, 180000);
    }

    startWebServer() {
        app.get('/', (req, res) => res.send('🤖 Abners Bot 2025 - Active & Running'));
        
        app.get('/health', async (req, res) => {
            const status = await this.keepAlive.getStatus();
            res.json({
                status: 'online',
                bot: 'Abners Bot 2025',
                whatsapp: this.isConnected ? 'connected' : 'disconnected',
                timestamp: new Date(),
                ...status
            });
        });

        app.get('/status', async (req, res) => {
            const status = await this.keepAlive.getStatus();
            res.json({
                whatsapp: this.isConnected ? 'connected' : 'disconnected',
                qrDisplayed: this.qrDisplayed,
                connectionAttempts: this.connectionAttempts,
                ...status
            });
        });

        app.listen(PORT, () => {
            console.log(`🌐 Web server running on port ${PORT}`);
            console.log('✅ Container is now fully operational!');
        });
    }

    startKeepAlivePings() {
        // Start pinging your own health endpoint
        const healthUrl = `http://localhost:${PORT}/health`;
        this.keepAlive.startPinging(healthUrl, 60000); // Ping every minute
        
        console.log('🔔 Keep-alive pings started');
    }

    async disconnect() {
        if (this.conn) {
            await this.conn.end();
        }
        this.keepAlive.stopPinging();
        this.isConnected = false;
        console.log('🔴 WhatsApp disconnected');
    }
}

module.exports = WhatsApp;
