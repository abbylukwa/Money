const WhatsApp = require("./lib/client")
const GroupManager = require("./plugins/group")

const start = async () => {
  try {
    const bot = new WhatsApp()
    await bot.connect();
    const groupManager = new GroupManager(bot.conn);
    await groupManager.start();
    
    await bot.web();
  } catch (error) {
    console.error(error)
  }
}
start()