import { UserData } from '../data/user.data'
import { Markup, Telegraf } from 'telegraf'
import { StartCommand} from './start.command'
import { CronJob } from "cron"



export class TelegramBot {
    private readonly bot: Telegraf
    constructor(apiToken: string) {
        this.bot = new Telegraf(apiToken)
    }

    public init() {
        this.bot.start((ctx) => {
            (new StartCommand(this.bot, ctx)).handle()
        })
        this.bot.launch()
    }
}
