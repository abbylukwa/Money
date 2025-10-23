const { makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion, getBinaryNodeMessages } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const app = express();
const { PORT } = require("./config");

async function connectToWhatsApp() {
    try {
        console.log('🔄 Requesting WhatsApp pairing for: +263775156210');
        
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: "fatal" }),
            printQRInTerminal: false,
            auth: {
                ...state,
                phoneNumber: "+263775156210"
            },
            browser: Browsers.ubuntu('Chrome')
        });

        sock.ev.on('creds.update', saveCreds);

        let pairingRequested = false;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (!pairingRequested) {
                pairingRequested = true;
                console.log('\n🔐 WHATSAPP PAIRING REQUESTED');
                console.log('══════════════════════════════════════');
                console.log('📱 PHONE: +263775156210');
                console.log('🔢 Waiting for pairing code...');
                console.log('══════════════════════════════════════');
                console.log('📱 On your phone with number +263775156210:');
                console.log('1. Open WhatsApp');
                console.log('2. Go to Settings → Linked Devices → Link a Device');
                console.log('3. Choose "Pair with code"');
                console.log('4. Wait for code to appear here...');
                console.log('⏳ Please wait...\n');
            }

            if (qr) {
                console.log('\n✅ PAIRING CODE RECEIVED:');
                console.log('══════════════════════════════════════');
                console.log(`📱 CODE: ${qr.substring(0, 8)}`);
                console.log('══════════════════════════════════════');
                console.log('📝 Enter this code in your WhatsApp app\n');
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp Connected Successfully for +263775156210!');
                console.log('🤖 Bot is now active and ready!');
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        });

        return sock;

    } catch (error) {
        console.error('❌ Error:', error.message);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

const web = () => {
    app.get('/', (req, res) => res.send('🤖 WhatsApp Bot - +263775156210'));
    app.listen(PORT, () => console.log(`🌐 Web server on port ${PORT}`));
}

class WhatsApp {
    async connect() {
        return await connectToWhatsApp();
    }

    async web() {
        return web();
    }
}

module.exports = WhatsApp;