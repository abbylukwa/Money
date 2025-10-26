const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pn = require('awesome-phonenumber');

const router = express.Router();

// Ensure sessions directory exists
const SESSIONS_DIR = './sessions';
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.existsSync(SESSIONS_DIR, { recursive: true });
}

// Generate unique session ID
function generateSessionId() {
    return 'WB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
    } catch (e) {
        console.error('Error removing file:', e);
    }
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    
    // Generate unique session ID
    const sessionId = generateSessionId();
    const sessionDir = path.join(SESSIONS_DIR, sessionId);

    // Remove existing session directory if it exists
    await removeFile(sessionDir);

    num = num.replace(/[^0-9]/g, '');

    const phone = pn('+' + num);
    if (!phone.isValid()) {
        if (!res.headersSent) {
            return res.status(400).send({ 
                code: 'Invalid phone number',
                sessionId: null
            });
        }
        return;
    }
    
    num = phone.getNumber('e164').replace('+', '');

    async function initiateSession() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        try {
            const { version } = await fetchLatestBaileysVersion();
            let WhatsBixby = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.windows('Chrome'),
                markOnlineOnConnect: false,
                generateHighQualityLinkPreview: false,
                defaultQueryTimeoutMs: 60000,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                retryRequestDelayMs: 250,
                maxRetries: 5,
            });

            WhatsBixby.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, isNewLogin, isOnline } = update;

                if (connection === 'open') {
                    console.log(`✅ Connected successfully for session: ${sessionId}`);
                    console.log("📱 Sending session info to user...");
                    
                    try {
                        const sessionFile = fs.readFileSync(sessionDir + '/creds.json');

                        const userJid = jidNormalizedUser(num + '@s.whatsapp.net');
                        
                        // Send session file
                        await WhatsBixby.sendMessage(userJid, {
                            document: sessionFile,
                            mimetype: 'application/json',
                            fileName: `whatsbixby_${sessionId}.json`
                        });
                        console.log("📄 Session file sent successfully");

                        // Send welcome message with session ID
                        await WhatsBixby.sendMessage(userJid, {
                            text: `🤖 *WhatsBixby Session Activated!*\n\n✅ Your WhatsApp is now connected to WhatsBixby bot.\n\n📋 *Session ID:* ${sessionId}\n\n💡 *Features:*\n• Auto-reply to messages\n• Smart responses\n• 24/7 availability\n\n⚠️ Keep your Session ID safe! Don't share it with anyone.\n\n🔧 Need help? Contact support.`
                        });
                        console.log("🤖 Welcome message sent successfully");

                        // Send setup guide
                        await WhatsBixby.sendMessage(userJid, {
                            image: { url: 'https://img.youtube.com/vi/-oz_u1iMgf8/maxresdefault.jpg' },
                            caption: `🎬 *WhatsBixby Setup Complete!*\n\n🚀 Your bot is now ready to use!\n📺 Watch Tutorial: https://youtu.be/-oz_u1iMgf8`
                        });
                        console.log("🎬 Setup guide sent successfully");

                        console.log(`✅ Session ${sessionId} setup completed successfully!`);
                        
                    } catch (error) {
                        console.error(`❌ Error sending messages for session ${sessionId}:`, error);
                    }
                }

                if (isNewLogin) {
                    console.log(`🔐 New login via pair code for session: ${sessionId}`);
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;

                    if (statusCode === 401) {
                        console.log(`❌ Logged out from WhatsApp for session: ${sessionId}`);
                        // Remove session directory on logout
                        removeFile(sessionDir);
                    } else {
                        console.log(`🔁 Connection closed for session ${sessionId} — will auto-reconnect`);
                    }
                }
            });

            if (!WhatsBixby.authState.creds.registered) {
                await delay(3000);
                num = num.replace(/[^\d+]/g, '');
                if (num.startsWith('+')) num = num.substring(1);

                try {
                    let code = await WhatsBixby.requestPairingCode(num);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    if (!res.headersSent) {
                        console.log(`📋 Session ${sessionId} - Number: ${num}, Code: ${code}`);
                        await res.send({ 
                            code: code,
                            sessionId: sessionId,
                            message: 'Session created successfully. Use the Session ID in your bot configuration.'
                        });
                    }
                } catch (error) {
                    console.error('Error requesting pairing code:', error);
                    if (!res.headersSent) {
                        res.status(503).send({ 
                            code: 'Service Unavailable',
                            sessionId: null
                        });
                    }
                    // Clean up session directory on error
                    removeFile(sessionDir);
                }
            }

            WhatsBixby.ev.on('creds.update', saveCreds);
        } catch (err) {
            console.error('Error initializing session:', err);
            if (!res.headersSent) {
                res.status(503).send({ 
                    code: 'Service Unavailable',
                    sessionId: null
                });
            }
            // Clean up session directory on error
            removeFile(sessionDir);
        }
    }

    await initiateSession();
});

// Error handling
process.on('uncaughtException', (err) => {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    if (e.includes("Stream Errored")) return;
    if (e.includes("statusCode: 515")) return;
    if (e.includes("statusCode: 503")) return;
    console.log('Caught exception: ', err);
});

module.exports = router;