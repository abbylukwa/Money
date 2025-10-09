const { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const qrcode = require("qrcode-terminal");
const app = express();
const { PORT } = require("../config");

let conn;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    conn = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu('Chrome'),
        auth: state
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Scan this QR code with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Connection closed. Reconnecting...');
                connectToWhatsApp();
            } else {
                console.log('Connection closed. Please scan QR again.');
            }
        }

        if (connection === 'open') {
            console.log('WhatsApp connected successfully!');
        }
    });

    return conn;
}

const web = () => {
    app.get('/', (req, res) => {
        res.send('Bot is running. Check Render logs for QR code.');
    });

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

class WhatsApp {
    async connect() {
        this.conn = await connectToWhatsApp();
        return this.conn;
    }

    async web() {
        return await web();
    }
}

module.exports = WhatsApp;