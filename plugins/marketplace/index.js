class Marketplace {
    constructor(sock) {
        this.sock = sock;
        this.users = new Map();
        this.setupHandlers();
    }

    setupHandlers() {
        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message) return;

            const text = this.extractText(message);
            const from = message.key.remoteJid;

            await this.handleMarketplaceCommand(text, from);
        });
    }

    extractText(message) {
        return message.message.conversation || message.message.extendedTextMessage?.text || '';
    }

    async handleMarketplaceCommand(text, from) {
        if (text === 'Pretty911') {
            await this.activateUser(from);
        }
        else if (text === '.plans') {
            await this.showPlans(from);
        }
        else if (text === '.mystatus') {
            await this.showUserStatus(from);
        }
        else if (text.startsWith('.search')) {
            await this.handleSearch(text, from);
        }
        else if (text === '.payment') {
            await this.showPaymentDetails(from);
        }
    }

    async activateUser(from) {
        if (!this.users.has(from)) {
            this.users.set(from, {
                activated: true,
                joinDate: new Date('2025-01-01'),
                searches: 0,
                subscription: null
            });

            const welcomeMsg = `✅ *ABNERS BOT 2025 ACTIVATED!* ✅\n\n` +
                              `🎉 Welcome to Abners 2025 Content Hub!\n` +
                              `📅 Valid until: December 2025\n\n` +
                              `🔍 *Free Features:*\n` +
                              `• Unlimited searches\n` +
                              `• Content browsing\n\n` +
                              `💳 *Premium Features:*\n` +
                              `• Download videos/music\n` +
                              `• Exclusive 2025 content\n\n` +
                              `📋 *Commands:*\n` +
                              `.plans - 2025 Subscription plans\n` +
                              `.search - Find 2025 content\n` +
                              `.mystatus - Your account status\n\n` +
                              `💳 *2025 Payment Numbers:*\n` +
                              `🇿🇼 EcoCash: 0777627210\n` +
                              `🇿🇦 Telkom: 0614159817`;

            await this.sock.sendMessage(from, { text: welcomeMsg });
        }
    }

    async showPlans(from) {
        const plansMsg = `📋 *2025 SUBSCRIPTION PLANS* 📋\n\n` +
                        `💰 *Monthly Plan 2025:* $3\n` +
                        `   └ Unlimited downloads\n` +
                        `   └ All 2025 content access\n` +
                        `   └ Valid until Dec 2025\n\n` +
                        `💰 *Weekly Plan 2025:* $1\n` +
                        `   └ 50 daily downloads\n` +
                        `   └ Basic content access\n` +
                        `   └ 2025 updates\n\n` +
                        `💰 *Daily Plan 2025:* $0.50\n` +
                        `   └ 20 downloads\n` +
                        `   └ Limited 2025 content\n\n` +
                        `💳 *2025 PAYMENT METHODS:*\n` +
                        `🇿🇼 EcoCash: 0777627210\n` +
                        `🇿🇦 Telkom: 0614159817\n\n` +
                        `🔑 *Activation Code:* Pretty911\n` +
                        `📞 *2025 Support:* 0777627210`;

        await this.sock.sendMessage(from, { text: plansMsg });
    }

    async showUserStatus(from) {
        const user = this.users.get(from);
        if (!user) {
            return;
        }

        const statusMsg = `📊 *2025 ACCOUNT STATUS* 📊\n\n` +
                         `✅ Activated: Yes\n` +
                         `🔍 Searches: ${user.searches}\n` +
                         `📅 Member since: ${user.joinDate.toLocaleDateString()}\n` +
                         `💳 Subscription: ${user.subscription ? 'Active' : 'None'}\n` +
                         `📅 Valid until: December 2025\n\n` +
                         `💳 EcoCash: 0777627210\n` +
                         `📱 Telkom: 0614159817\n` +
                         `🔑 Code: Pretty911`;

        await this.sock.sendMessage(from, { text: statusMsg });
    }

    async handleSearch(text, from) {
        const user = this.users.get(from);
        if (!user) {
            return;
        }

        user.searches++;
        const query = text.replace('.search', '').trim() || '2025 trending content';
        
        const searchMsg = `🔍 *2025 SEARCH RESULTS* 🔍\n\n` +
                         `*Query:* "${query}"\n` +
                         `*Status:* 2025 Content available!\n\n` +
                         `🌐 *2025 Download Instructions:*\n` +
                         `1. Subscribe with .plans\n` +
                         `2. Pay to 0777627210\n` +
                         `3. Send receipt for access\n` +
                         `4. Download 2025 content\n\n` +
                         `💳 *2025 Payment:* 0777627210\n` +
                         `📞 *2025 Support:* 0777627210\n` +
                         `🔑 *Code:* Pretty911`;

        await this.sock.sendMessage(from, { text: searchMsg });
    }

    async showPaymentDetails(from) {
        const paymentMsg = `💳 *2025 PAYMENT DETAILS* 💳\n\n` +
                          `🇿🇼 *ZIMBABWE 2025 (EcoCash):*\n` +
                          `📱 Number: 0777627210\n` +
                          `💸 Methods: EcoCash, WorldRemit, MoneyGram\n\n` +
                          `🇿🇦 *SOUTH AFRICA 2025 (Telkom):*\n` +
                          `📱 Number: 0614159817\n` +
                          `💸 Methods: Airtime, Mobile Money\n\n` +
                          `💰 *2025 Subscription Plans:*\n` +
                          `• Monthly: $3 - Unlimited\n` +
                          `• Weekly: $1 - 50/day\n` +
                          `• Daily: $0.50 - 20\n\n` +
                          `🔑 *2025 Activation:* Pretty911\n` +
                          `📅 *Valid until:* December 2025`;

        await this.sock.sendMessage(from, { text: paymentMsg });
    }
}

module.exports = Marketplace;