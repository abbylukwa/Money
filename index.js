const WhatsApp = require("./client")
const GroupManager = require("./plugins/group-manager")
const AutoJoinManager = require("./plugins/auto-join-manager")
const Marketplace = require("./plugins/marketplace")

class BotManager {
    constructor() {
        this.admins = [
            '263775156210@s.whatsapp.net', // Fixed number format
            '27614159817@s.whatsapp.net', 
            '263717457592@s.whatsapp.net',
            '263777627210@s.whatsapp.net'
        ];
        
        this.botStarted = false;
        this.socketReady = false;
    }

    async start() {
        try {
            const bot = new WhatsApp()
            const conn = await bot.connect();
            
            console.log('🚀 Initializing bot systems...');
            
            // Wait for socket to be fully ready
            await this.waitForSocketReady(conn);
            
            // Initialize all managers with the connected socket
            const groupManager = new GroupManager(conn);
            await groupManager.start();
            
            const autoJoinManager = new AutoJoinManager(conn);
            const marketplace = new Marketplace(conn);
            
            await bot.web();
            
            // Notify admins that bot is online (now socket is ready)
            await this.notifyAdmins(conn);
            
            // Setup command handler
            this.setupCommandHandler(conn);
            
            this.botStarted = true;
            this.socketReady = true;
            console.log('✅ All systems started successfully!');
            console.log('📱 Bot is ready and connected to WhatsApp!');
            
        } catch (error) {
            console.error('❌ Startup error:', error)
        }
    }

    async waitForSocketReady(conn) {
        console.log('⏳ Waiting for WhatsApp connection to be ready...');
        return new Promise((resolve) => {
            const checkReady = () => {
                if (conn.user && conn.user.id) {
                    console.log('✅ WhatsApp connection ready!');
                    resolve();
                } else {
                    console.log('⏳ Still waiting for connection...');
                    setTimeout(checkReady, 1000);
                }
            };
            checkReady();
        });
    }

    async notifyAdmins(conn) {
        console.log('📢 Notifying admins that bot is online...');
        
        // Double check socket is ready
        if (!conn.user || !conn.user.id) {
            console.log('❌ Socket not ready for admin notifications');
            return;
        }
        
        const onlineMessage = `🤖 *BOT DEPLOYMENT NOTIFICATION*\n\n` +
                             `✅ *WhatsBixby Bot is Now Online!*\n\n` +
                             `🕒 *Deployment Time:* ${new Date().toLocaleString()}\n` +
                             `🌐 *Status:* Connected and Ready\n` +
                             `📱 *Bot ID:* ${conn.user.id.split(':')[0]}\n\n` +
                             `📋 Use *.help* to see all available commands`;

        for (const admin of this.admins) {
            try {
                await conn.sendMessage(admin, { text: onlineMessage });
                console.log(`✅ Notification sent to admin: ${admin}`);
                // Add delay to avoid rate limiting
                await this.delay(2000);
            } catch (error) {
                console.log(`❌ Failed to notify admin ${admin}:`, error.message);
            }
        }
    }

    setupCommandHandler(conn) {
        conn.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message) return;

            const text = message.message.conversation || 
                         message.message.extendedTextMessage?.text || '';
            const from = message.key.remoteJid;

            // Help command for everyone
            if (text === '.help' || text === '.commands') {
                await this.sendHelpMessage(conn, from, this.isAdmin(from));
            }

            // Admin-only commands
            if (this.isAdmin(from)) {
                if (text === '.admin') {
                    await this.sendAdminCommands(conn, from);
                } else if (text === '.botstatus') {
                    await this.sendBotStatus(conn, from);
                } else if (text === '.stats') {
                    await this.sendSystemStats(conn, from);
                }
            }

            // Test command
            if (text === 'ping' || text === 'Ping') {
                await conn.sendMessage(from, { 
                    text: '✅ Pong! Bot is working!' 
                });
            }
            
            // Status command
            if (text === '.status') {
                await conn.sendMessage(from, { 
                    text: `🤖 *BOT STATUS*\n\n✅ Connected to WhatsApp\n🟢 All systems online\n📱 Ready to receive commands\n\nSocket Ready: ${this.socketReady ? '✅ Yes' : '❌ No'}` 
                });
            }
        });
    }

    async sendHelpMessage(conn, to, isAdmin = false) {
        let helpMessage = `🤖 *WHATSBIXBY BOT COMMANDS*\n\n` +
                         `🔰 *BASIC COMMANDS:*\n` +
                         `• .help - Show this help message\n` +
                         `• .status - Check bot status\n` +
                         `• ping - Test if bot is responsive\n\n` +
                         
                         `🛍️ *MARKETPLACE COMMANDS:*\n` +
                         `• abby9111 - Activate marketplace\n` +
                         `• .plans - View subscription plans\n` +
                         `• .payments - Payment information\n` +
                         `• .search [query] - Search for content\n` +
                         `• .mystatus - Check your account status\n\n` +
                         
                         `👥 *GROUP FEATURES:*\n` +
                         `• Auto-joins group links\n` +
                         `• Sends welcome messages\n` +
                         `• Music & comedy content sharing\n\n`;

        if (isAdmin) {
            helpMessage += `⚡ *ADMIN COMMANDS:*\n` +
                          `• .admin - Admin commands\n` +
                          `• .botstatus - Detailed bot status\n` +
                          `• .stats - System statistics\n\n` +
                          `💡 Use *.admin* for full admin command list`;
        }

        helpMessage += `\n🌐 *Our Websites:*\n` +
                      `• https://123.com\n` +
                      `• https://abc.com`;

        await conn.sendMessage(to, { text: helpMessage });
    }

    async sendAdminCommands(conn, to) {
        const adminMessage = `⚡ *ADMIN COMMANDS*\n\n` +
                            `📊 *Monitoring:*\n` +
                            `• .admin stats - System statistics\n` +
                            `• .botstatus - Bot status details\n` +
                            `• .stats - Quick stats overview\n\n` +
                            
                            `👥 *User Management:*\n` +
                            `• .admin users - List all users\n` +
                            `• .admin user [jid] - User info\n\n` +
                            
                            `🔧 *Bot Control:*\n` +
                            `• .broadcast [message] - Broadcast to all groups\n` +
                            `• .restart - Restart bot (if implemented)\n\n` +
                            
                            `📈 *Revenue Tracking:*\n` +
                            `• Monitor subscription payments\n` +
                            `• Track user growth\n` +
                            `• View download statistics`;

        await conn.sendMessage(to, { text: adminMessage });
    }

    async sendBotStatus(conn, to) {
        const statusMessage = `🤖 *BOT STATUS DETAILS*\n\n` +
                             `✅ *Status:* Online and Connected\n` +
                             `🕒 *Uptime:* ${this.getUptime()}\n` +
                             `📅 *Started:* ${new Date().toLocaleString()}\n` +
                             `👥 *Admins:* ${this.admins.length} configured\n` +
                             `🌐 *Web Server:* Running on port ${process.env.PORT || 8080}\n` +
                             `📡 *Socket Ready:* ${this.socketReady ? '✅ Yes' : '❌ No'}\n\n` +
                             
                             `📊 *System Info:*\n` +
                             `• Node.js: ${process.version}\n` +
                             `• Platform: ${process.platform}\n` +
                             `• Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n\n` +
                             
                             `🔔 *All systems operational*`;

        await conn.sendMessage(to, { text: statusMessage });
    }

    async sendSystemStats(conn, to) {
        const statsMessage = `📊 *SYSTEM STATISTICS*\n\n` +
                            `👥 *Admins:* ${this.admins.length}\n` +
                            `🔄 *Socket Status:* ${this.socketReady ? 'Ready' : 'Not Ready'}\n` +
                            `⏰ *Uptime:* ${this.getUptime()}\n\n` +
                            `💡 Bot is running and monitoring channels`;

        await conn.sendMessage(to, { text: statsMessage });
    }

    isAdmin(userJid) {
        return this.admins.includes(userJid);
    }

    getUptime() {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the bot
const botManager = new BotManager();
botManager.start();
