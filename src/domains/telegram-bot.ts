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

        (new StartCommand(this.bot)).handle()
        
        
        this.bot.launch()
    }

    private onStart(ctx: any) {
        

    }
}
