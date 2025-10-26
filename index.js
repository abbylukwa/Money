import { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import qrcode from 'qrcode-terminal';
import pino from "pino";
import express from "express";
import { PORT } from "./config.js";
import pairRouter from "./pair.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const ADMINS = [
    '263717457592@s.whatsapp.net',
    '263777627210@s.whatsapp.net', 
    '27614159817@s.whatsapp.net'
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pair', pairRouter);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pair.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'online',
        bot: 'Knight Bot 2025',
        timestamp: new Date().toISOString()
    });
});

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "silent" }),
            auth: state,
            browser: Browsers.ubuntu('Chrome'),
            printQRInTerminal: false
        });

        sock.ev.on('creds.update', saveCreds);

        let qrDisplayed = false;
        let isConnected = false;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !qrDisplayed) {
                qrDisplayed = true;
                console.clear();
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'open' && !isConnected) {
                isConnected = true;
                console.clear();
                console.log('✅ WhatsApp Connected!');
                notifyAdminsOnline(sock);
            }

            if (connection === 'close') {
                console.clear();
                console.log('❌ Connection closed');
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    setTimeout(() => connectToWhatsApp(), 5000);
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            if (!isConnected) return;
            
            const message = m.messages[0];
            if (message.key.fromMe || !message.message) return;

            const jid = message.key.remoteJid;
            const user = message.pushName || 'Unknown';
            
            console.log(`📨 Message from ${user}: ${getMessageText(message)}`);
            
            if (message.message.conversation || message.message.extendedTextMessage) {
                const text = getMessageText(message).toLowerCase();
                
                if (text === 'ping') {
                    await sock.sendMessage(jid, { text: '🏓 Pong!' });
                }
                
                if (text === '!status') {
                    await sock.sendMessage(jid, { text: '🤖 Bot is online and running!' });
                }
            }
        });

        return sock;

    } catch (error) {
        console.clear();
        console.log('❌ Connection error, reconnecting...');
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

function getMessageText(message) {
    if (message.message.conversation) {
        return message.message.conversation;
    }
    if (message.message.extendedTextMessage) {
        return message.message.extendedTextMessage.text;
    }
    if (message.message.imageMessage) {
        return message.message.imageMessage.caption || '[Image]';
    }
    return '[Media Message]';
}

async function notifyAdminsOnline(sock) {
    const onlineMessage = '🤖 *Bot Status Update*\n\n✅ Bot is now online and ready!\n\n*Connection Time:* ' + new Date().toLocaleString();
    
    for (const admin of ADMINS) {
        try {
            await sock.sendMessage(admin, { 
                text: onlineMessage 
            });
            console.log(`📢 Online notification sent to: ${admin}`);
        } catch (error) {
            console.log(`❌ Failed to notify admin ${admin}:`, error.message);
        }
    }
}

class WhatsApp {
    async connect() {
        this.conn = await connectToWhatsApp();
        return this.conn;
    }

    async startWeb() {
        const server = app.listen(PORT, () => {
            console.log(`🌐 Web server running on port ${PORT}`);
        });

        process.on('SIGTERM', () => {
            server.close(() => {
                console.log('🌐 Web server closed');
                process.exit(0);
            });
        });

        return server;
    }
}

const bot = new WhatsApp();

bot.connect();
bot.startWeb();

export default WhatsApp;