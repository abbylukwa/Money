const { PORT, ADMINS, MONGODB_URI, BOT_NUMBER } = require("./config");
const { connectToWhatsApp } = require("./client");
const { logToTerminal } = require("./print");

// Simple banner
console.log(`
╦  ╦╦╔═╗╔╗╔╔╦╗╦ ╦  ╔╗╔╔═╗╦ ╦
║  ║║║ ║║║║ ║ ╠═╣  ║║║║╣ ║ ║
╩═╝╩╩╚═╝╝╚╝ ╩ ╩ ╩  ╝╚╝╚═╝╚═╝
`);
console.log('🚀 Advanced WhatsApp Bot');
console.log('=============================================\n');

// Start the application
async function startApplication() {
    try {
        logToTerminal('🚀 Starting Knight WhatsApp Bot...');
        logToTerminal('🔐 Authentication Method: Pairing Code');
        logToTerminal(`👑 Configured Admins: ${ADMINS.length}`);
        logToTerminal(`📞 Bot Number: ${BOT_NUMBER}`);
        
        logToTerminal('\n🎯 Waiting for pairing code generation...');
        logToTerminal('📱 A real pairing code will be generated automatically');
        logToTerminal('====================================\n');
        
        // Start WhatsApp connection
        await connectToWhatsApp();
        
        logToTerminal('\n📝 **CONNECTION INSTRUCTIONS:**');
        logToTerminal('1. Wait for the real pairing code to be generated');
        logToTerminal('2. Open WhatsApp on your phone');
        logToTerminal('3. Go to Settings → Linked Devices');
        logToTerminal('4. Tap "Link a Device"');
        logToTerminal('5. Tap "Link with phone number instead"');
        logToTerminal('6. Enter the pairing code shown above');
        logToTerminal('7. Bot will connect automatically');
        logToTerminal('8. Use "menu" command in WhatsApp to see commands\n');

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
