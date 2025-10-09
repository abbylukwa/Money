class AutoJoinManager {
    constructor(sock) {
        this.sock = sock;
        this.joinedGroups = new Set();
    }

    start() {
        if (!this.sock) {
            console.log('Socket not available');
            return;
        }

        this.sock.ev.on('messages.upsert', async (data) => {
            try {
                const message = data.messages[0];
                if (message && message.message) {
                    await this.processMessage(message);
                }
            } catch (error) {
                console.log('Error processing message:', error.message);
            }
        });

        console.log('AutoJoinManager started');
    }

    async processMessage(message) {
        const text = message.message.conversation || 
                    message.message.extendedTextMessage?.text || 
                    message.message.buttonsResponseMessage?.selectedDisplayText ||
                    '';

        const groupLink = this.extractGroupLink(text);
        if (groupLink) {
            await this.joinGroup(groupLink);
        }
    }

    extractGroupLink(text) {
        const whatsappLinkRegex = /https?:\/\/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/gi;
        const matches = text.match(whatsappLinkRegex);
        return matches ? matches[0] : null;
    }

    async joinGroup(groupLink) {
        try {
            const inviteCode = groupLink.split('/').pop();
            
            const result = await this.sock.groupAcceptInvite(inviteCode);
            
            if (result) {
                console.log(`Joined group: ${result}`);
                this.joinedGroups.add(result);
                return true;
            }
        } catch (error) {
            console.log('Failed to join group:', error.message);
        }
        return false;
    }

    getStats() {
        return {
            joinedGroups: this.joinedGroups.size
        };
    }
}

module.exports = AutoJoinManager;