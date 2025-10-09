class UserManager {
    constructor() {
        this.users = new Map();
    }

    activateUser(userJid) {
        this.users.set(userJid, {
            activated: true,
            subscription: null,
            searches: 0,
            downloads: 0,
            joinDate: new Date(),
            lastActive: new Date()
        });

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
                          `.mystatus - Check your status`;

        return welcomeMsg;
    }

    getUser(userJid) {
        return this.users.get(userJid);
    }

    activateSubscription(userJid, subscription) {
        const user = this.users.get(userJid);
        if (user) {
            user.subscription = subscription;
            user.lastActive = new Date();
        }
    }

    incrementSearches(userJid) {
        const user = this.users.get(userJid);
        if (user) {
            user.searches++;
            user.lastActive = new Date();
        }
    }

    incrementDownloads(userJid) {
        const user = this.users.get(userJid);
        if (user) {
            user.downloads++;
            user.lastActive = new Date();
        }
    }

    async showUserStatus(from, subscriptionManager) {
        const user = this.getUser(from);
        if (!user) {
            return "❌ Not activated. Send the activation code: Abby9111";
        }

        let statusMsg = `📊 *YOUR ACCOUNT STATUS*\n\n`;
        statusMsg += `✅ *Activated:* Yes\n`;
        statusMsg += `🔍 *Searches:* ${user.searches}\n`;
        statusMsg += `📥 *Downloads:* ${user.downloads}\n`;
        statusMsg += `📅 *Member since:* ${user.joinDate.toLocaleDateString()}\n\n`;

        if (user.subscription) {
            const isExpired = subscriptionManager.isSubscriptionExpired(user.subscription);
            statusMsg += `💳 *Subscription:* ${user.subscription.plan.name}\n`;
            statusMsg += `📅 *Expires:* ${new Date(user.subscription.expiry).toLocaleDateString()}\n`;
            statusMsg += `🔔 *Status:* ${isExpired ? 'EXPIRED ❌' : 'ACTIVE ✅'}\n\n`;
            
            if (isExpired) {
                statusMsg += `💡 Renew with *.subscribe monthly*`;
            }
        } else {
            statusMsg += `💳 *Subscription:* None\n`;
            statusMsg += `💡 Subscribe with *.plans*`;
        }

        return statusMsg;
    }

    getAllUsers() {
        return Array.from(this.users.entries()).map(([jid, user]) => ({
            jid,
            ...user
        }));
    }

    getStats() {
        const totalUsers = this.users.size;
        const activeSubscriptions = Array.from(this.users.values()).filter(user => 
            user.subscription
        ).length;

        return {
            totalUsers,
            activeSubscriptions,
            totalSearches: Array.from(this.users.values()).reduce((sum, user) => sum + user.searches, 0),
            totalDownloads: Array.from(this.users.values()).reduce((sum, user) => sum + user.downloads, 0)
        };
    }
}

module.exports = UserManager;