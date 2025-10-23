const WhatsApp = require("./client");
const GroupManager = require("./plugins/group-manager");
const AutoJoinManager = require("./plugins/auto-join-manager");
const Marketplace = require("./plugins/marketplace");

class BotManager {
    constructor() {
        this.authorizedNumbers = [
            '263717457592@s.whatsapp.net', // 0717457592
            '263777627210@s.whatsapp.net', // 0777627210
            '27614159817@s.whatsapp.net'   // +27 61 415 9817
        ];
        this.botStarted = false;
        this.socketReady = false;
        this.startTime = new Date('2025-01-01');
        this.joinedGroups = new Set();
    }

    async start() {
        try {
            console.log('🚀 Starting Abners Bot 2025...');
            const bot = new WhatsApp();
            const conn = await bot.connect();
            
            const groupManager = new GroupManager(conn, this.joinedGroups);
            await groupManager.start();
            
            const autoJoinManager = new AutoJoinManager(conn);
            const marketplace = new Marketplace(conn);
            
            await bot.web();
            await this.notifyAuthorizedUsers(conn);
            this.setupCommandHandler(conn);
            
            this.botStarted = true;
            this.socketReady = true;
            console.log('✅ Abners Bot 2025 started successfully!');
            
        } catch (error) {
            console.error('❌ Startup error:', error);
        }
    }

    async notifyAuthorizedUsers(conn) {
        console.log('📢 Notifying authorized users...');
        if (!conn.user) return;

        const onlineMessage = `🤖 *ABNERS BOT 2025 IS ONLINE* 🤖\n\n` +
                             `✅ System: Active & Running\n` +
                             `📅 Year: 2025 Edition\n` +
                             `🕒 Started: ${new Date('2025-01-01').toLocaleString()}\n` +
                             `📱 Status: Connected to WhatsApp\n\n` +
                             `💳 *PAYMENT NUMBERS:*\n` +
                             `🇿🇼 EcoCash: 0777627210\n` +
                             `🇿🇦 Telkom: 0614159817\n\n` +
                             `🔑 *Activation Code:* Pretty911\n` +
                             `📋 Use *.help* for commands`;

        for (const user of this.authorizedNumbers) {
            try {
                await conn.sendMessage(user, { text: onlineMessage });
                console.log(`✅ Notification sent to authorized user`);
                await this.delay(1000);
            } catch (error) {
                console.log(`❌ Failed to notify user`);
            }
        }
    }

    setupCommandHandler(conn) {
        conn.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const message = messages[0];
                if (!message.message) return;

                const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
                const from = message.key.remoteJid;

                if (!this.isAuthorized(from)) {
                    return;
                }

                console.log(`📩 Authorized message from ${from}: ${text}`);

                if (text === '.help' || text === '.commands') {
                    await this.sendHelpMessage(conn, from);
                }
                else if (text === '.test') {
                    await this.sendTestMessage(conn, from);
                }
                else if (text === '.status') {
                    await this.sendBotStatus(conn, from);
                }
                else if (text === '.ping') {
                    await conn.sendMessage(from, { text: '✅ Pong! Abners Bot 2025 is active!' });
                }
                else if (text === '.payment') {
                    await this.sendPaymentInfo(conn, from);
                }
                else if (text === '.setup') {
                    await this.sendSetupGuide(conn, from);
                }
                else if (text === '.users') {
                    await this.sendAuthorizedUsers(conn, from);
                }
                else if (text === '.broadcast') {
                    await this.broadcastToAllGroups(conn, from);
                }

            } catch (error) {
                console.log('Command error:', error.message);
            }
        });
    }

    async broadcastToAllGroups(conn, from) {
        if (this.joinedGroups.size === 0) {
            await conn.sendMessage(from, { text: '❌ No groups available for broadcasting' });
            return;
        }

        const broadcastMessages = [
            `🎉 *DAILY UPDATE FROM ABNERS BOT 2025* 🎉\n\nFresh content available!\nUse .search to find trending music, comedy & news\n\n💳 EcoCash: 0777627210\n📱 Telkom: 0614159817`,

            `🔥 *TRENDING NOW 2025* 🔥\n\nNew music, comedy & entertainment updates!\nActivate with: Pretty911\n\n💸 Payments: 0777627210 / 0614159817`,

            `🚀 *ABNERS BOT 2025 UPDATE* 🚀\n\nDaily content drops:\n• Music by genre\n• Comedy shows\n• News updates\n• Motivational quotes\n\n🔑 Activation: Pretty911`,

            `🎵 *MUSIC & ENTERTAINMENT 2025* 🎵\n\nFresh content every day!\nSubscribe for unlimited downloads\n\n💳 EcoCash: 0777627210\n📱 Telkom: 0614159817`,

            `🌟 *PREMIUM CONTENT 2025* 🌟\n\nAccess exclusive music, comedy & videos\nActivate with: Pretty911\n\n📞 Support: 0777627210`
        ];

        const randomMessage = broadcastMessages[Math.floor(Math.random() * broadcastMessages.length)];
        let successCount = 0;

        for (const groupJid of this.joinedGroups) {
            try {
                await conn.sendMessage(groupJid, { text: randomMessage });
                successCount++;
                await this.delay(2000);
            } catch (error) {
                console.log(`❌ Failed to broadcast to group: ${groupJid}`);
            }
        }

        await conn.sendMessage(from, { text: `✅ Broadcast sent to ${successCount}/${this.joinedGroups.size} groups` });
    }

    async sendHelpMessage(conn, to) {
        const helpMessage = `🤖 *ABNERS BOT 2025 COMMANDS* 🤖\n\n` +
                         `🔰 *BASIC COMMANDS:*\n` +
                         `• .help - Show commands\n` +
                         `• .status - Bot status\n` +
                         `• .ping - Test response\n` +
                         `• .payment - Payment info\n` +
                         `• .setup - Setup guide\n` +
                         `• .users - Authorized users\n` +
                         `• .broadcast - Send to all groups\n\n` +
                         
                         `🛍️ *MARKETPLACE:*\n` +
                         `• Pretty911 - Activate account\n` +
                         `• .plans - Subscription plans\n` +
                         `• .mystatus - Account status\n` +
                         `• .search - Find content\n\n` +
                         
                         `💳 *PAYMENT NUMBERS:*\n` +
                         `🇿🇼 EcoCash: 0777627210\n` +
                         `🇿🇦 Telkom: 0614159817`;

        await conn.sendMessage(to, { text: helpMessage });
    }

    async sendTestMessage(conn, to) {
        const testMessage = `🧪 *SYSTEM TEST 2025* 🧪\n\n` +
                          `✅ All Systems: OPERATIONAL\n` +
                          `📱 WhatsApp: CONNECTED\n` +
                          `🎵 Music Channel: ACTIVE\n` +
                          `🎭 Comedy Channel: ACTIVE\n` +
                          `📰 News System: ACTIVE\n` +
                          `📅 Year: 2025 EDITION\n\n` +
                          `💳 Payments: 0777627210 / 0614159817\n` +
                          `🔑 Activation: Pretty911`;

        await conn.sendMessage(to, { text: testMessage });
    }

    async sendBotStatus(conn, to) {
        const statusMessage = `🤖 *ABNERS BOT 2025 STATUS* 🤖\n\n` +
                             `✅ System: ONLINE\n` +
                             `📅 Year: 2025 Edition\n` +
                             `🕒 Uptime: ${this.getUptime()}\n` +
                             `👥 Users: ${this.authorizedNumbers.length}\n` +
                             `👥 Groups: ${this.joinedGroups.size}\n` +
                             `🔐 Access: RESTRICTED\n\n` +
                             `💳 EcoCash: 0777627210\n` +
                             `📱 Telkom: 0614159817`;

        await conn.sendMessage(to, { text: statusMessage });
    }

    async sendPaymentInfo(conn, to) {
        const paymentMessage = `💳 *PAYMENT INFORMATION 2025* 💳\n\n` +
                             `🇿🇼 *ZIMBABWE (EcoCash):*\n` +
                             `📱 Number: 0777627210\n` +
                             `💸 Send via: EcoCash, WorldRemit, MoneyGram\n\n` +
                             `🇿🇦 *SOUTH AFRICA (Telkom):*\n` +
                             `📱 Number: 0614159817\n` +
                             `💸 Send via: Airtime, Mobile Money\n\n` +
                             `💰 *2025 SUBSCRIPTION PLANS:*\n` +
                             `• Monthly: $3 - Unlimited downloads\n` +
                             `• Weekly: $1 - 50 daily downloads\n` +
                             `• Daily: $0.50 - 20 downloads\n\n` +
                             `🔑 *Activation Code:* Pretty911\n` +
                             `📅 *Valid until:* December 2025`;

        await conn.sendMessage(to, { text: paymentMessage });
    }

    async sendSetupGuide(conn, to) {
        const setupMessage = `🔧 *2025 SETUP GUIDE* 🔧\n\n` +
                           `1. *ACTIVATE:* Send "Pretty911"\n` +
                           `2. *VIEW PLANS:* Send ".plans"\n` +
                           `3. *MAKE PAYMENT:* Send to:\n` +
                           `   🇿🇼 EcoCash: 0777627210\n` +
                           `   🇿🇦 Telkom: 0614159817\n` +
                           `4. *CONFIRM:* Send receipt details\n` +
                           `5. *DOWNLOAD:* Use ".search [content]"`;

        await conn.sendMessage(to, { text: setupMessage });
    }

    async sendAuthorizedUsers(conn, to) {
        const usersMessage = `👥 *AUTHORIZED USERS 2025* 👥\n\n` +
                           `✅ *Zimbabwe:* 0777627210\n` +
                           `✅ *Zimbabwe:* 0717457592\n` +
                           `✅ *South Africa:* 0614159817\n\n` +
                           `🔐 *Private Bot System*\n` +
                           `📅 Valid: 2025 Edition`;

        await conn.sendMessage(to, { text: usersMessage });
    }

    isAuthorized(userJid) {
        return this.authorizedNumbers.includes(userJid);
    }

    getUptime() {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const botManager = new BotManager();
botManager.start();