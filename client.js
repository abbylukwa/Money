const fs = require('fs');
const path = require('path');

async function connectToWhatsApp() {
    try {
        console.log('🔄 Starting WhatsApp connection for Abners Bot 2025...');
        
        // Check if session exists
        const sessionExists = fs.existsSync('./session/creds.json');
        if (sessionExists) {
            console.log('🔍 Existing session found, attempting to restore...');
        }
        
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

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !qrDisplayed) {
                qrDisplayed = true;
                console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP:\n');
                
                // Ensure clean QR display
                setTimeout(() => {
                    qrcode.generate(qr, { small: true });
                    console.log('\n⏳ Please scan the QR code within 30 seconds...');
                }, 1000);
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp Connected Successfully!');
                console.log('🤖 Bot is now ready to receive messages...');
            }

            if (connection === 'close') {
                console.log('❌ Connection closed');
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    console.log('🔄 Attempting to reconnect...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                } else {
                    console.log('❌ Invalid session, please delete session folder and restart');
                }
            }
        });

        return sock;

    } catch (error) {
        console.error('❌ Connection error:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}
