const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const qrcode = require("qrcode-terminal");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu('Chrome'),
        auth: state,
        printQRInTerminal: true,
        syncFullHistory: false,
        markOnlineOnConnect: false
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('🔐 Scan QR Code with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            console.log('🔄 Connection closed, reconnecting in 5 seconds...');
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp Connected Successfully!');
        }
    });

    return conn;
}

const web = () => {
    app.get('/', (req, res) => res.send('Abners Bot - Active & Running'));
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