import { initDatabase } from "./db/init-database"
import { ConfigService } from './domains/config'
import { TelegramBot } from "./domains/telegram-bot"

const startBot = async (): Promise<void> => {
    const bot = new TelegramBot(new ConfigService().get('TELEGRAM-API-TOKEN'))
    bot.init()
    console.log('Started telegram bot')
}

initDatabase().then(startBot)
