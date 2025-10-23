const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

class WhatsApp {
    constructor() {
        this.isConnected = false;
        this.qrDisplayed = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.init();
    }

    init() {
        // Start web server IMMEDIATELY
        this.startWebServer();
        
        // Start WhatsApp connection in background
        setTimeout(() => {
            this.connect();
        }, 2000);
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
            this.conn.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));

            return this.conn;

        } catch (error) {
            console.error('❌ Connection error:', error);
            
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                setTimeout(() => this.connect(), 5000);
            }
        }
    }

    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !this.qrDisplayed) {
            this.qrDisplayed = true;
            console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n⏳ Waiting for QR scan...');
            console.log('🌐 Web server is running at http://localhost:' + PORT);
        }

        if (connection === 'open') {
            this.isConnected = true;
            console.log('✅ WhatsApp Connected Successfully!');
            console.log('🤖 Bot is now fully operational!');
        }

        if (connection === 'close') {
            console.log('❌ Connection closed');
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            
            if (shouldReconnect && this.connectionAttempts < this.maxConnectionAttempts) {
                this.isConnected = false;
                this.qrDisplayed = false;
                setTimeout(() => this.connect(), 5000);
            }
        }
    }

    startWebServer() {
        // Health endpoint that shows connection status
        app.get('/health', (req, res) => {
            res.json({
                status: 'online',
                bot: 'Abners Bot 2025',
                whatsapp: this.isConnected ? 'connected' : 'disconnected',
                qr_ready: this.qrDisplayed && !this.isConnected,
                connection_attempts: this.connectionAttempts,
                timestamp: new Date().toISOString()
            });
        });

        app.get('/', (req, res) => {
            if (this.isConnected) {
                res.send(`
                    <h1>🤖 Abners Bot 2025</h1>
                    <p>Status: <strong style="color: green;">Connected ✅</strong></p>
                    <p>Bot is fully operational and ready to receive messages.</p>
                `);
            } else if (this.qrDisplayed) {
                res.send(`
                    <h1>🤖 Abners Bot 2025</h1>
                    <p>Status: <strong style="color: orange;">Waiting for QR Scan 📱</strong></p>
                    <p>Please scan the QR code in the terminal to connect WhatsApp.</p>
                `);
            } else {
                res.send(`
                    <h1>🤖 Abners Bot 2025</h1>
                    <p>Status: <strong style="color: blue;">Starting up... 🔄</strong></p>
                    <p>Bot is initializing. Please wait...</p>
                `);
            }
        });

        app.get('/status', (req, res) => {
            res.json({
                whatsapp_connected: this.isConnected,
                qr_displayed: this.qrDisplayed,
                connection_attempts: this.connectionAttempts,
                server_time: new Date().toISOString()
            });
        });

        // Start server immediately
        app.listen(PORT, () => {
            console.log(`🌐 Web server immediately started on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📱 Status page: http://localhost:${PORT}/status`);
        });
    }
}

module.exports = WhatsApp;
