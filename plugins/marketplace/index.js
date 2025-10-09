const SubscriptionManager = require('./subscription-manager');
const PaymentProcessor = require('./payment-processor');
const UserManager = require('./user-manager');
const AdminManager = require('./admin-manager');
const SearchEngine = require('./search-engine');

class Marketplace {
    constructor(sock) {
        this.sock = sock;
        
        this.userManager = new UserManager();
        this.paymentProcessor = new PaymentProcessor();
        this.subscriptionManager = new SubscriptionManager();
        this.adminManager = new AdminManager();
        this.searchEngine = new SearchEngine();
        
        this.setupHandlers();
    }

    setupHandlers() {
        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message) return;

            const text = this.extractText(message);
            const from = message.key.remoteJid;

            await this.handleCommand(text, from, message);
        });
    }

    extractText(message) {
        return message.message.conversation || 
               message.message.extendedTextMessage?.text || '';
    }

    async handleCommand(text, from, message) {
        const commands = {
            'abby9111': () => this.userManager.activateUser(from),
            '.subscribe': () => this.subscriptionManager.handleSubscription(text, from),
            '.search': () => this.searchEngine.handleSearch(text, from),
            '.download': () => this.subscriptionManager.handleDownload(text, from),
            '.plans': () => this.subscriptionManager.showPlans(from),
            '.mystatus': () => this.userManager.showUserStatus(from, this.subscriptionManager),
            '.payments': () => this.paymentProcessor.showPaymentMethods(from),
            '.confirm': () => this.paymentProcessor.confirmPayment(text, from, this.userManager, this.subscriptionManager),
            '.admin': () => this.adminManager.handleAdminCommand(text, from, this.userManager, this.subscriptionManager)
        };

        for (const [prefix, handler] of Object.entries(commands)) {
            if (text.startsWith(prefix) || text === prefix) {
                await handler();
                return;
            }
        }
    }

    getStats() {
        return {
            users: this.userManager.getStats(),
            subscriptions: this.subscriptionManager.getStats(),
            payments: this.paymentProcessor.getStats()
        };
    }
}

module.exports = Marketplace;