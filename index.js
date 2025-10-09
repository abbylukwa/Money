class Marketplace {
    constructor(sock) {
        this.sock = sock;
        this.setupHandlers();
    }

    setupHandlers() {
        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message) return;

            const text = this.extractText(message);
            const from = message.key.remoteJid;

            await this.handleCommand(text, from);
        });
    }

    extractText(message) {
        return message.message.conversation || 
               message.message.extendedTextMessage?.text || '';
    }

    async handleCommand(text, from) {
        if (text === 'abby9111') {
            await this.activateUser(from);
        } else if (text === '.plans') {
            await this.showPlans(from);
        } else if (text.startsWith('.search ')) {
            await this.handleSearch(text, from);
        } else if (text === '.payments') {
            await this.showPayments(from);
        } else if (text === '.mystatus') {
            await this.showUserStatus(from);
        }
    }

    async activateUser(from) {
        const welcomeMsg = `✅ *ACTIVATION SUCCESSFUL!*\n\n` +
                          `Welcome to Abby Content Marketplace! 🎉\n\n` +
                          `🔍 *Free Features:*\n` +
                          `• Unlimited web searches\n` +
                          `• Browse content catalog\n\n` +
                          `💳 *Premium Features:*\n` +
                          `• Download photos/videos\n` +
                          `• Access to exclusive content\n\n` +
                          `📋 *Available Commands:*\n` +
                          `.plans - View subscription plans\n` +
                          `.search [query] - Search for content\n` +
                          `.payments - Payment information\n` +
                          `.mystatus - Check your account status\n\n` +
                          `💡 Use *.help* for all bot commands`;

        await this.sock.sendMessage(from, { text: welcomeMsg });
    }

    async showPlans(from) {
        const plansMsg = `📋 *SUBSCRIPTION PLANS*\n\n` +
                        `💰 *Monthly:* $3 - Unlimited downloads\n` +
                        `💰 *Weekly:* $1 - 50 daily downloads\n` +
                        `💰 *Daily:* $0.50 - 20 downloads\n\n` +
                        `💡 Use *.subscribe [plan]* to buy\n\n` +
                        `Example: *.subscribe monthly*`;

        await this.sock.sendMessage(from, { text: plansMsg });
    }

    async handleSearch(text, from) {
        const query = text.replace('.search ', '').trim();
        const searchMsg = `🔍 *SEARCH: ${query}*\n\n` +
                         `🌐 *Browse our websites:*\n` +
                         `• https://123.com\n` +
                         `• https://abc.com\n\n` +
                         `💡 Search for "${query}" on our websites\n\n` +
                         `🔓 *Premium Feature:* Subscribe to download content directly`;

        await this.sock.sendMessage(from, { text: searchMsg });
    }

    async showPayments(from) {
        const paymentMsg = `💳 *PAYMENT INFORMATION*\n\n` +
                          `🇿🇼 *Zimbabwe (Econet):*\n` +
                          `📱 *Number:* 0777627210\n` +
                          `👤 *Name:* Your Name\n` +
                          `💰 *Methods:* EcoCash, OneMoney\n\n` +
                          `🇿🇦 *South Africa (Telekom):*\n` +
                          `📱 *Number:* +27 61 415 9817\n` +
                          `👤 *Name:* Your Name\n` +
                          `💰 *Methods:* Telekom Payments\n\n` +
                          `💡 Include your order ID in payment reference`;

        await this.sock.sendMessage(from, { text: paymentMsg });
    }

    async showUserStatus(from) {
        const statusMsg = `📊 *ACCOUNT STATUS*\n\n` +
                         `🔓 *Access Level:* Basic (Free)\n` +
                         `🔍 *Searches:* Unlimited\n` +
                         `📥 *Downloads:* Subscribe to unlock\n\n` +
                         `💡 Use *.plans* to view subscription options`;

        await this.sock.sendMessage(from, { text: statusMsg });
    }
}

module.exports = Marketplace;
