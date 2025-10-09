class SubscriptionManager {
    constructor() {
        this.plans = {
            monthly: {
                name: "Monthly Subscription",
                price: 3,
                currency: "USD",
                duration: 30,
                downloads: "unlimited",
                description: "Unlimited downloads for 30 days - Best value!"
            },
            weekly: {
                name: "Weekly Subscription", 
                price: 1,
                currency: "USD",
                duration: 7,
                downloads: "50 per day",
                description: "50 daily downloads for 7 days"
            },
            daily: {
                name: "Daily Subscription",
                price: 0.5, 
                currency: "USD",
                duration: 1,
                downloads: "20 downloads",
                description: "20 downloads for 24 hours"
            }
        };
    }

    async handleSubscription(text, from) {
        const planType = text.replace('.subscribe ', '').trim().toLowerCase();
        const plan = this.plans[planType];

        if (!plan) {
            await this.sock.sendMessage(from, { 
                text: "❌ Invalid plan. Use *.plans* to see available plans." 
            });
            return null;
        }

        return plan;
    }

    async showPlans(from) {
        let plansMsg = `📋 *SUBSCRIPTION PLANS*\n\n`;

        Object.entries(this.plans).forEach(([key, plan]) => {
            plansMsg += `🆔 *${key.toUpperCase()}*\n` +
                       `💰 *Price:* ${plan.currency} ${plan.price}\n` +
                       `⏰ *Duration:* ${plan.duration} days\n` +
                       `📥 *Downloads:* ${plan.downloads}\n` +
                       `📝 *${plan.description}*\n` +
                       `────────────────────\n\n`;
        });

        plansMsg += `💡 *HOW TO SUBSCRIBE:*\n` +
                   `Send *.subscribe [plan]*\n` +
                   `Example: *.subscribe monthly*\n\n` +
                   `🎉 *Best Value:* Monthly plan at only $3!`;

        await this.sock.sendMessage(from, { text: plansMsg });
    }

    async handleDownload(text, from, userManager) {
        const user = userManager.getUser(from);
        if (!user || !user.activated) {
            await this.sock.sendMessage(from, { 
                text: "❌ Please activate first with code: Abby9111" 
            });
            return;
        }

        if (!user.subscription || this.isSubscriptionExpired(user.subscription)) {
            await this.sock.sendMessage(from, { 
                text: "❌ Active subscription required\nUse *.plans* to subscribe" 
            });
            return;
        }

        const contentQuery = text.replace('.download ', '').trim();
        userManager.incrementDownloads(from);

        const downloadMsg = `📥 *DOWNLOAD CONTENT*\n\n` +
                           `*Search:* "${contentQuery}"\n\n` +
                           `🌐 *Download from our websites:*\n` +
                           `1. Visit: https://123.com\n` +
                           `2. Search for: "${contentQuery}"\n` +
                           `3. Download your preferred content\n\n` +
                           `🔗 *Alternative Site:* https://abc.com\n\n` +
                           `📊 *Your Usage:*\n` +
                           `• Downloads: ${user.downloads}\n` +
                           `• Plan: ${user.subscription.plan.name}\n` +
                           `• Expires: ${new Date(user.subscription.expiry).toLocaleDateString()}`;

        await this.sock.sendMessage(from, { text: downloadMsg });
    }

    isSubscriptionExpired(subscription) {
        return new Date() > new Date(subscription.expiry);
    }

    createSubscription(plan) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + plan.duration);
        
        return {
            plan: plan,
            startDate: new Date(),
            expiry: expiry
        };
    }

    getStats() {
        return {
            totalPlans: Object.keys(this.plans).length,
            plans: this.plans
        };
    }
}

module.exports = SubscriptionManager;