import { Markup, Telegraf, Scenes } from "telegraf";
import { UserData } from "../data/user.data";
import { TaskData } from "../data/task.data";
import { CronJob, CronTime } from "cron"
import { TaskModel } from "db/task.db";


export class StartCommand {
    private isWaitingForUser: boolean
    private isWaitingForTimer: boolean
    private cronJob: CronJob | null
    public bot: Telegraf
    private task: string = '' 
    private current:number = 0
    

    constructor(bot: Telegraf) {
        this.bot = bot
        this.isWaitingForUser = true
        this.isWaitingForTimer = true
        this.cronJob = null
    }

    handle(): void {
        
        this.bot.start((_ctx) => {
            UserData.save(
                {
                    userId: _ctx.from.id.toString(),
                    firstName: _ctx.from.first_name,
                    lastName: _ctx.from.last_name ?? '',
                    username: _ctx.from.username ?? ''
                }
            )
            this.cronJob = null
            _ctx.replyWithHTML("Добро пожаловать в бот", Markup.keyboard([
                ["Введите новую задачу",  "Показать все активные задачи"],
                ["Отключить напоминание и закрыть задачу"], 
                ["Добавить напоминалку к самой ранней задаче (Укажите интервал в минутах)"],
              ]))

        this.bot.hears('Введите новую задачу', async (ctx) => {
            this.current = 1
            this.bot.on("text", (newCtx) => {
                if(this.current == 1) {
                        TaskData.saveAndShow(newCtx.from.id.toString(), newCtx.message.text).then((res) => {
                            newCtx.reply(res == '' ? 'Нет задач' : res)
                        })
                    
                    this.current = 0
                }

                if(this.current == 2) {  
                    if(/^\d+$/.test(newCtx.message.text)) {
                        const interval:number = parseInt(newCtx.message.text)
                        TaskData.oldest(newCtx.from.id.toString()).then((message) => {
                            if(message != '') {
                                this.task = message
                                this.cronJob = new CronJob(`*/${interval} * * * *`, async () => {
                                    newCtx.reply(`Напоминаем о задаче: ${message}`)
                                })
                                this.cronJob.start()
                                newCtx.reply(`Напоминалка добавлена (${interval} минут)`)
                            } else {
                                newCtx.reply(`Нет задач`)
                            }
                        })
                    } else {
                        ctx.reply('Некорректный ввод. Укажите интервал в минутах')
                    }

                    this.current = 0
                }
            })
        })


        this.bot.hears('Отключить напоминание и закрыть задачу', async (ctx1) => {
            if(this.cronJob) {
                this.cronJob?.stop()
                TaskData.delete(ctx1.from.id.toString(), this.task)
                ctx1.reply('Готово')
                this.cronJob = null
            } else {
                ctx1.reply('Сначала установите напоминалку')
            }
        })

        

        

        this.bot.hears('Добавить напоминалку к самой ранней задаче (Укажите интервал в минутах)', async (ctx) => {
            this.current = 2
            if(this.cronJob == null) {
                this.bot.on("text", (newCtx) => {
                if(this.current == 1) {
                    TaskData.save(newCtx.from.id.toString(), newCtx.message.text)

                    newCtx.reply('Задача добавлена')

                    this.current = 0
                }
                if(this.current == 2) {  
                    if(/^\d+$/.test(newCtx.message.text)) {
                        const interval:number = parseInt(newCtx.message.text)
                        TaskData.oldest(newCtx.from.id.toString()).then((message) => {
                            if(message != '') {
                                this.task = message
                                this.cronJob = new CronJob(`*/${interval} * * * *`, async () => {
                                    newCtx.reply(`Напоминаем о задаче: ${message}`)
                                })
                                this.cronJob.start()
                                newCtx.reply(`Напоминалка добавлена (${interval} минут)`)
                            } else {
                                newCtx.reply(`Нет задач`)
                            }
                        })
                    } else {
                        ctx.reply('Некорректный ввод. Укажите интервал в минутах')
                    }
                    this.current = 0
                }
            })
                
            } else {
                ctx.reply('Напоминалка уже в работе')
            }
            
        })

        this.bot.hears('Некорректный ввод. Укажите интервал в минутах)', async (ctx) => {
            
            if(this.cronJob == null) {
                this.bot.on("text", (newCtx) => {
                
                
                if(/^\d+$/.test(newCtx.message.text)) {
                    const interval:number = parseInt(newCtx.message.text)
                    TaskData.oldest(newCtx.from.id.toString()).then((message) => {
                        if(message != '') {
                            this.task = message
                            this.cronJob = new CronJob(`*/${interval} * * * *`, async () => {
                                newCtx.reply(`Напоминаем о задаче: ${message}`)
                            })
                            this.cronJob.start()
                            newCtx.reply(`Напоминалка добавлена (${interval} минут)`)
                        } else {
                            newCtx.reply(`Нет задач`)
                        }
                    })
                } else {
                    ctx.reply('Некорректный ввод. Укажите интервал в минутах')

                    
                }
            })
                
                
            } else {
                ctx.reply('Напоминалка уже в работе')
            }
            
        })

        

        this.bot.hears('Показать все активные задачи', async (ctx) => {
           
            TaskData.show(ctx.from.id.toString()).then((res) => {
                
                    ctx.reply(res == '' ? 'Нет задач' : res)
                
            })

        })
        
        });

 

       
 }
}