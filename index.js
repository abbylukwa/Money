const { PORT, ADMINS, MONGODB_URI, BOT_NUMBER } = require("./config");
const { connectToWhatsApp } = require("./client");
const { logToTerminal } = require("./print");

// Display banner without chalk
console.log('\x1b[33m%s\x1b[0m', `
╦  ╦╦╔═╗╔╗╔╔╦╗╦ ╦  ╔╗╔╔═╗╦ ╦
║  ║║║ ║║║║ ║ ╠═╣  ║║║║╣ ║ ║
╩═╝╩╩╚═╝╝╚╝ ╩ ╩ ╩  ╝╚╝╚═╝╚═╝
`);
console.log('🚀 Advanced WhatsApp Bot with Pairing Code');
console.log('=============================================\n');

// Start the application
async function startApplication() {
    try {
        logToTerminal('🚀 Starting Knight WhatsApp Bot...');
        logToTerminal('🔐 Authentication Methods: QR Code & Pairing Code');
        logToTerminal(`👑 Configured Admins: ${ADMINS.length}`);
        logToTerminal(`📞 Bot Number: ${BOT_NUMBER}`);
        
        // Display pairing code prominently
        logToTerminal('\n🎯 ================================');
        logToTerminal('🎯 PAIRING CODE: MEGAAI44');
        logToTerminal('🎯 ================================');
        logToTerminal('📱 Use this code in WhatsApp → Linked Devices');
        logToTerminal('📱 Tap "Link with phone number instead"');
        logToTerminal('📱 Enter code: MEGAAI44');
        logToTerminal('====================================\n');
        
        // Start WhatsApp connection
        await connectToWhatsApp();
        
        logToTerminal('\n📝 **CONNECTION INSTRUCTIONS:**');
        logToTerminal('1. Open WhatsApp on your phone');
        logToTerminal('2. Go to Settings → Linked Devices');
        logToTerminal('3. Tap "Link a Device"');
        logToTerminal('4. Tap "Link with phone number instead"');
        logToTerminal('5. Enter pairing code: MEGAAI44');
        logToTerminal('6. Bot will connect automatically');
        logToTerminal('7. Use "menu" command in WhatsApp to see commands\n');

    } catch (error) {
        logToTerminal(`❌ Failed to start application: ${error}`);
        process.exit(1);
    }
}

// Start the bot
startApplication().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
