const { PORT, ADMINS, MONGODB_URI, BOT_NUMBER } = require("./config");
const { connectToWhatsApp, waitForConnection } = require("./client");
const { logToTerminal } = require("./print");

// Simple banner
console.log(`
╦  ╦╦╔═╗╔╗╔╔╦╗╦ ╦  ╔╗╔╔═╗╦ ╦
║  ║║║ ║║║║ ║ ╠═╣  ║║║║╣ ║ ║
╩═╝╩╩╚═╝╝╚╝ ╩ ╩ ╩  ╝╚╝╚═╝╚═╝
`);
console.log('🚀 Real WhatsApp Bot Connection');
console.log('=============================================\n');

// Start the application
async function startApplication() {
    try {
        logToTerminal('🚀 Starting Real WhatsApp Bot...');
        logToTerminal(`📞 Your Bot Number: ${BOT_NUMBER}`);
        logToTerminal(`👑 Configured Admins: ${ADMINS.length}`);
        
        logToTerminal('\n📝 **CONNECTION INSTRUCTIONS:**');
        logToTerminal('1. Wait for the REAL pairing code to be generated');
        logToTerminal('2. Open WhatsApp on your phone');
        logToTerminal('3. Go to Settings → Linked Devices');
        logToTerminal('4. Tap "Link a Device"');
        logToTerminal('5. Tap "Link with phone number instead"');
        logToTerminal('6. Enter the REAL pairing code shown above');
        logToTerminal('7. Your WhatsApp will be connected to the bot');
        logToTerminal('8. Use "menu" command to see available commands\n');
        
        // Start WhatsApp connection
        await connectToWhatsApp();
        
        // Wait for the connection to be established
        logToTerminal('⏳ Waiting for WhatsApp connection...');
        await waitForConnection();
        
        logToTerminal('\n✅ Bot is fully operational and ready!');
        logToTerminal('📱 You can now use WhatsApp commands');

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
