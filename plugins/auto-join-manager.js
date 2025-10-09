class AutoJoinManager {
    constructor(sock) {
        this.sock = sock;
        this.config = {
            autoJoin: true,
            welcomeMessage: true
        };

        this.setupHandlers();
    }

    setupHandlers() {
        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message) return;

            const text = message.message.conversation || 
                         message.message.extendedTextMessage?.text || '';

            console.log(`🔗 Checking for group link in message from ${message.key.remoteJid}`);

            if (this.config.autoJoin && text.includes('chat.whatsapp.com/')) {
                await this.handleGroupLink(text, message.key.remoteJid);
            }
        });
    }

    async handleGroupLink(link, fromJid) {
        try {
            const groupCode = this.extractGroupCode(link);
            if (!groupCode) return;

            console.log(`🔗 Joining group: ${groupCode}`);
            
            const result = await this.sock.groupAcceptInvite(groupCode);
            if (result) {
                await this.sock.sendMessage(fromJid, { text: '✅ Joined group successfully!' });
            }
        } catch (error) {
            await this.sock.sendMessage(fromJid, { text: '❌ Failed to join group' });
        }
    }

    extractGroupCode(link) {
        const match = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }
}

module.exports = AutoJoinManager;
