const fs = require("fs");
const { ADMINS } = require("./config");
const { logToTerminal } = require("./print");

const COMMANDS = {
    'hello': '👋 Hello! I\'m Knight WhatsApp Bot.',
    'hi': '👋 Hi there!',
    'ping': '🏓 Pong! Knight Bot is online!',
    'menu': `📱 *Knight Bot Commands*

🔄 *Basic Commands:*
• hello/hi - Greeting
• ping - Check status
• menu - Show this menu

🎵 *Music Commands:*
• music schedule - Show music schedule
• music chart - Current chart toppers

🎭 *Entertainment Commands:*
• comedy - Random comedy content
• meme - Send funny memes
• quote - Motivational quote

📊 *Stats Commands:*
• stats - Bot statistics
• info - System information`,

    'default': '🤖 I\'m Knight WhatsApp Bot. Type "menu" for commands.'
};

// Command handler
async function handleCommand(jid, text, sock, isConnected) {
    if (!sock || !isConnected) {
        return "🔄 Bot is still connecting, please wait...";
    }
    
    // Basic commands
    if (text === 'ping') {
        return '🏓 Pong! Knight Bot is alive and running!';
    }
    
    if (text === 'info' || text === 'stats') {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        return `📊 *Knight Bot Statistics*

🤖 *Bot Info:*
• Name: Knight Bot
• Version: 2.0.0
• Uptime: ${hours}h ${minutes}m ${seconds}s
• Connection: ${isConnected ? '✅ Connected' : '❌ Disconnected'}

🗄️ *Storage:*
• Session: ${fs.existsSync('./sessions') ? '✅ Active' : '❌ None'}

👥 *Users:*
• Admins: ${ADMINS.length}
• Status: ✅ Operational

💡 *Features:*
• Auto-reply system
• Multi-auth support
• Pairing Code: MEGAAI44`;
    }
    
    return COMMANDS[text] || COMMANDS.default;
}

// Utility function to extract message text
function getMessageText(message) {
    if (message.message.conversation) {
        return message.message.conversation;
    }
    if (message.message.extendedTextMessage) {
        return message.message.extendedTextMessage.text;
    }
    if (message.message.imageMessage) {
        return message.message.imageMessage.caption || '';
    }
    if (message.message.videoMessage) {
        return message.message.videoMessage.caption || '';
    }
    if (message.message.documentMessage) {
        return message.message.documentMessage.caption || '';
    }
    return '';
}

module.exports = { handleCommand, getMessageText };
