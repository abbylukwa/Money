const WhatsApp = require("./client")
const GroupManager = require("./plugins/group-manager")
const Marketplace = require("./plugins/marketplace")
const KeepAlive = require("./keep alive")

const start = async () => {
  try {
    const bot = new WhatsApp()
    await bot.connect();
    
    // Initialize all managers
    const groupManager = new GroupManager(bot.conn);
    await groupManager.start();
    
    const autoJoinManager = new AutoJoinManager(bot.conn);
    const marketplace = new Marketplace(bot.conn);
    
    // Start keep-alive service
    const keepAlive = new KeepAlive();
    keepAlive.startPinging(process.env.APP_URL || 'http://localhost:8080', 300000);
    
    await bot.web();
    
    console.log('✅ All systems started successfully!');
  } catch (error) {
    console.error('❌ Startup error:', error)
  }
}

start()