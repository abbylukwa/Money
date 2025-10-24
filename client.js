const qrcode = require('qrcode-terminal');
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");
const KeepAlive = require("./keepAlive");

// Add these missing imports
const { 
    useMultiFileAuthState, 
    makeWASocket, 
    fetchLatestBaileysVersion,
    Browsers,
    DisconnectReason 
} = require('@whiskeysockets/baileys');

class WhatsApp {
    constructor() {
        this.keepAlive = new KeepAlive();
        this.isConnected = false;
        this.qrDisplayed = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.qrTimeout = null;
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
                printQRInTerminal: false,
                // Add these options for better connection
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                emitOwnEvents: true,
                defaultQueryTimeoutMs: 60000,
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

        console.log('🔧 Connection update:', { 
            connection, 
            hasQR: !!qr,
            lastDisconnect: lastDisconnect?.error?.message 
        });

        if (qr) {
            this.handleQRCode(qr);
        }

        if (connection === 'open') {
            this.handleConnectionOpen();
        }

        if (connection === 'close') {
            this.handleConnectionClose(lastDisconnect);
        }
    }

    handleQRCode(qr) {
        if (!this.qrDisplayed) {
            this.qrDisplayed = true;
            console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP:\n');
            
            // Clear any existing QR timeout
            if (this.qrTimeout) {
                clearTimeout(this.qrTimeout);
            }
            
            // Generate QR code with error handling
            try {
                qrcode.generate(qr, { small: true }, (qrcode) => {
                    console.log(qrcode);
                });
            } catch (error) {
                console.log('❌ Error generating QR code:', error);
                // Fallback: show the QR string for manual scanning
                console.log('🔤 QR String (manual):', qr);
            }
            
            console.log('\n⏳ Waiting for QR scan... (Container will stay alive)');
            
            // Reset connection attempts when QR is shown
            this.connectionAttempts = 0;
            
            // Extended timeout for QR scanning
            this.startQRTimeout();
        }
    }

    handleConnectionOpen() {
        this.isConnected = true;
        this.qrDisplayed = false;
        
        // Clear QR timeout if connection is successful
        if (this.qrTimeout) {
            clearTimeout(this.qrTimeout);
            this.qrTimeout = null;
        }
        
        console.log('✅ WhatsApp Connected Successfully!');
        console.log('🤖 Bot is now ready to receive messages...');
        
        // Start web server and keep-alive pings after connection
        this.startWebServer();
        this.startKeepAlivePings();
    }

    handleConnectionClose(lastDisconnect) {
        console.log('❌ Connection closed');
        
        // Clear QR timeout
        if (this.qrTimeout) {
            clearTimeout(this.qrTimeout);
            this.qrTimeout = null;
        }
        
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`🔍 Disconnect reason: ${statusCode}`);
        console.log(`🔄 Should reconnect: ${shouldReconnect}`);

        if (shouldReconnect && this.connectionAttempts < this.maxConnectionAttempts) {
            console.log('🔄 Attempting to reconnect...');
            this.isConnected = false;
            this.qrDisplayed = false;
            setTimeout(() => this.connect(), 5000);
        } else {
            console.log('❌ Max reconnection attempts reached or invalid session.');
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('🚪 Logged out from WhatsApp. Please scan QR code again.');
                // You might want to delete the session folder here
            }
        }
    }

    startProcessKeepAlive() {
        console.log('💓 Starting process keep-alive...');
        
        const heartbeat = setInterval(() => {
            if (!this.isConnected) {
                console.log('⏰ Still waiting for WhatsApp connection...');
                console.log(`📊 Connection attempts: ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
            } else {
                clearInterval(heartbeat);
            }
        }, 30000);

        process.stdin.resume();

        process.on('SIGTERM', () => {
            console.log('📦 Received SIGTERM, cleaning up...');
            this.cleanup();
        });

        process.on('SIGINT', () => {
            console.log('📦 Received SIGINT, cleaning up...');
            this.cleanup();
        });
    }

    startQRTimeout() {
        // Give user 3 minutes to scan QR code
        this.qrTimeout = setTimeout(() => {
            if (!this.isConnected) {
                console.log('\n⚠️  QR Code expired. Generating new QR code...');
                this.qrDisplayed = false;
                // The connection will automatically generate a new QR
            }
        }, 180000); // 3 minutes
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
        const healthUrl = `http://localhost:${PORT}/health`;
        this.keepAlive.startPinging(healthUrl, 60000);
        console.log('🔔 Keep-alive pings started');
    }

    cleanup() {
        if (this.qrTimeout) {
            clearTimeout(this.qrTimeout);
        }
        this.disconnect();
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
