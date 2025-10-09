class AdminManager {
    constructor() {
        this.admins = [
            '0775156210@s.whatsapp.net',
            '27614159817@s.whatsapp.net', 
            '263717457592@s.whatsapp.net',
            '263777627210@s.whatsapp.net'
        ];
    }

    isAdmin(userJid) {
        return this.admins.includes(userJid);
    }

    async handleAdminCommand(text, from, userManager, subscriptionManager) {
        if (!this.isAdmin(from)) {
            await this.sock.sendMessage(from, { 
                text: "❌ Admin access required" 
            });
            return;
        }

        const command = text.replace('.admin ', '').trim();
        
        if (command === 'stats') {
            await this.showStats(from, userManager, subscriptionManager);
        } else if (command.startsWith('user ')) {
            await this.showUserInfo(command, from, userManager);
        } else if (command === 'users') {
            await this.listAllUsers(from, userManager);
        } else {
            await this.showAdminHelp(from);
        }
    }

    async showStats(from, userManager, subscriptionManager) {
        const userStats = userManager.getStats();
        const subStats = subscriptionManager.getStats();

        const statsMsg = `📊 *SYSTEM STATISTICS*\n\n` +
                        `👥 *Users:* ${userStats.totalUsers}\n` +
                        `💳 *Subscriptions:* ${userStats.activeSubscriptions}\n` +
                        `🔍 *Total Searches:* ${userStats.totalSearches}\n` +
                        `📥 *Total Downloads:* ${userStats.totalDownloads}\n\n` +
                        `📋 *Subscription Plans:* ${subStats.totalPlans}\n` +
                        `💰 *Monthly Price:* $${subStats.plans.monthly.price}\n` +
                        `💰 *Weekly Price:* $${subStats.plans.weekly.price}\n` +
                        `💰 *Daily Price:* $${subStats.plans.daily.price}`;

        await this.sock.sendMessage(from, { text: statsMsg });
    }

    async showUserInfo(command, from, userManager) {
        const userJid = command.replace('user ', '').trim();
        const user = userManager.getUser(userJid);

        if (!user) {
            await this.sock.sendMessage(from, { 
                text: `❌ User not found: ${userJid}` 
            });
            return;
        }

        const userInfo = `👤 *USER INFORMATION*\n\n` +
                        `📱 *JID:* ${userJid}\n` +
                        `✅ *Activated:* ${user.activated ? 'Yes' : 'No'}\n` +
                        `🔍 *Searches:* ${user.searches}\n` +
                        `📥 *Downloads:* ${user.downloads}\n` +
                        `📅 *Joined:* ${user.joinDate.toLocaleDateString()}\n` +
                        `🕒 *Last Active:* ${user.lastActive.toLocaleDateString()}\n\n`;

        let subscriptionInfo = '';
        if (user.subscription) {
            subscriptionInfo = `💳 *SUBSCRIPTION*\n` +
                              `📦 *Plan:* ${user.subscription.plan.name}\n` +
                              `💰 *Price:* $${user.subscription.plan.price}\n` +
                              `📅 *Started:* ${user.subscription.startDate.toLocaleDateString()}\n` +
                              `⏰ *Expires:* ${user.subscription.expiry.toLocaleDateString()}\n` +
                              `🔔 *Status:* ${new Date() > user.subscription.expiry ? 'EXPIRED' : 'ACTIVE'}`;
        } else {
            subscriptionInfo = `💳 *SUBSCRIPTION:* None`;
        }

        await this.sock.sendMessage(from, { text: userInfo + subscriptionInfo });
    }

    async listAllUsers(from, userManager) {
        const users = userManager.getAllUsers();
        
        if (users.length === 0) {
            await this.sock.sendMessage(from, { 
                text: "❌ No users found" 
            });
            return;
        }

        let usersList = `👥 *ALL USERS (${users.length})*\n\n`;
        
        users.slice(0, 10).forEach((user, index) => {
            const shortJid = user.jid.split('@')[0];
            usersList += `${index + 1}. ${shortJid}\n`;
            usersList += `   📊 S:${user.searches} D:${user.downloads}\n`;
            usersList += `   💳 ${user.subscription ? 'SUBSCRIBED' : 'NO SUB'}\n\n`;
        });

        if (users.length > 10) {
            usersList += `... and ${users.length - 10} more users`;
        }

        await this.sock.sendMessage(from, { text: usersList });
    }

    async showAdminHelp(from) {
        const helpMsg = `🛠️ *ADMIN COMMANDS*\n\n` +
                       `.admin stats - System statistics\n` +
                       `.admin user [jid] - User information\n` +
                       `.admin users - List all users\n\n` +
                       `📊 *Monitor subscription revenue and user growth*`;

        await this.sock.sendMessage(from, { text: helpMsg });
    }
}

module.exports = AdminManager;