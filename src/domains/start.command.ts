import { Markup, Telegraf, Scenes, Context } from "telegraf";
import { UserData } from "../data/user.data";
import { TaskData, TaskType } from "../data/task.data";
import { CronJob, CronTime } from "cron"
import { TaskModel, ITask} from "db/task.db";



export class StartCommand {
    private cronJob: CronJob | null
    public bot: Telegraf
    private task: string = '' 
    private current: number = 0
    private lookingAtId: TaskType | null = null 
    private cronMap: Map<string, CronJob> = new Map<string, CronJob>()
    

    constructor(bot: Telegraf) {
        this.bot = bot
        this.cronJob = null
    }

    populateArrayNames(list: ITask[], widthMax: number): any[]{
        const newList:any[] = []
        for(let i = 0; i < list.length; ) {
            const subList:string[] = []
            for (let j = 0; j < widthMax && i < list.length; j++, i++) {
                if(this.cronMap.has(list[i].taskId)) {
                    subList.push(list[i].taskContent)
                } else {
                    subList.push(list[i].taskContent)
                }
                
            }
            newList.push(subList)
        } 

        newList.push(['На главную'])

        return newList
    }

    populateArrayIds(list: ITask[]): any[]{
        const newList: any[] = []
        const widthMax: number = 5
        for(let i = 0; i < list.length; ) {
            const subList:string[] = []
            for (let j = 0; j < widthMax && i < list.length; j++, i++) {
                if(this.cronMap.has(list[i].taskId)) {
                    subList.push(list[i].taskId)
                } else {
                    subList.push(list[i].taskId)
                }
            }
            newList.push(subList)
        } 
newList.push(['На главную'])
        return newList
    }

    createHears(list: ITask[]):void {
        for(let i = 0; i < list.length; i++) {
            this.bot.hears(list[i].taskContent, async (ctx) => {
            this.lookingAtId = {
                userId: ctx.from.id.toString(),
                taskId: list[i].taskId,
                taskContent: list[i].taskContent 
            } as TaskType
            ctx.replyWithHTML(`Управление задачей: ${list[i].taskContent}`, Markup.keyboard(
                [['Изменить', 'Удалить'], 
                ['Добавить напоминание', 'Убрать напоминание'], 
                ['На главную']]))
        })
        }
    }

    repopulateArrayAndShow(ctx: any, res: ITask[], message: string) {
            const listSize:number = res.length
            if (listSize == 0) {
                ctx.reply('Нет задач')
            } else if (listSize < 7) {
                ctx.replyWithHTML(message, Markup.keyboard(
                    this.populateArrayNames(res, 2)
                ))
                this.createHears(res)
            } else if (listSize < 11) {
                ctx.replyWithHTML(message, Markup.keyboard(
                    this.populateArrayNames(res, 3)
                ))
                this.createHears(res)
            } else {
                ctx.replyWithHTML(message, Markup.keyboard(
                    this.populateArrayIds(res)
                ))//сhange
                this.createHears(res)
            }
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
                ["Введите новую задачу"],  ["Показать все активные задачи"]]))


        this.bot.hears('Показать все активные задачи', async (ctx) => {
           
            TaskData.getAll(ctx.from.id.toString()).then((res) => {
                const listSize:number = res.length
                if (listSize == 0) {
                    ctx.reply('Нет задач')
                } else if (listSize < 7) {
                    ctx.replyWithHTML(`${listSize} активных задач`, Markup.keyboard(
                        this.populateArrayNames(res, 2)
                    ))
                    this.createHears(res)
                } else if (listSize < 11) {
                    ctx.replyWithHTML(`${listSize} активных задач`, Markup.keyboard(
                        this.populateArrayNames(res, 3)
                    ))
                    this.createHears(res)
                } else {
                    ctx.replyWithHTML(`${listSize} активных задач`, Markup.keyboard(
                        this.populateArrayIds(res)
                    ))//сhange
                    this.createHears(res)
                }
            })
        })
        
        });


        this.bot.hears('На главную', (ctx) => {
            ctx.replyWithHTML("Главная", Markup.keyboard([
                ["Введите новую задачу"],  ["Показать все активные задачи"]]))
        })

        this.bot.hears('Удалить', (ctx) => {
            if(!this.lookingAtId) {
                ctx.replyWithHTML("На главную", Markup.keyboard([
                    ["Введите новую задачу"],  ["Показать все активные задачи"]]))
            }
            TaskData.deleteId(this.lookingAtId)
            ctx.replyWithHTML("Задача удалена", Markup.keyboard([
                ["Введите новую задачу"],  ["Показать все активные задачи"]]))
        })

        this.bot.hears('Изменить', (ctx) => {
            if(!this.lookingAtId) {
                ctx.replyWithHTML("На главную", Markup.keyboard([
                    ["Введите новую задачу"],  ["Показать все активные задачи"]]))
            }
            this.current = 3
            ctx.reply(`Введите изменную задачу ${this.lookingAtId?.taskContent}`)
            this.bot.on("text", (newCtx) => {
                if(this.current == 1) {
                     TaskData.saveAndGetAll(newCtx.from.id.toString(), newCtx.message.text).then((docs) => {
                        if(docs) {
                            this.repopulateArrayAndShow(newCtx, docs, "Задача добавлена")
                        } else {
                            newCtx.replyWithHTML("На главную", Markup.keyboard([
                                ["Введите новую задачу"],  ["Показать все активные задачи"]]))
                        }
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
                        newCtx.reply('Некорректный ввод. Укажите интервал в минутах')
                    }
                    this.current = 0
                }
                

                if(this.current == 3) {
                    
                    TaskData.updateIdAndGetAll(this.lookingAtId, newCtx.message.text).then((docs) => {
                        if(docs) {
                            this.repopulateArrayAndShow(newCtx, docs, "Задача изменена")
                        } else {
                            newCtx.replyWithHTML("На главную", Markup.keyboard([
                                ["Введите новую задачу"],  ["Показать все активные задачи"]]))
                        }
                    })
                    
                    this.current = 0
                }
            }) 
        })

        this.bot.hears('Некорректный ввод. Укажите интервал в минутах', (ctx) => {
            this.current = 2
            this.bot.on("text", (newCtx) => {
                if(this.current == 1) {
                     TaskData.saveAndGetAll(newCtx.from.id.toString(), newCtx.message.text).then((docs) => {
                        if(docs) {
                            this.repopulateArrayAndShow(newCtx, docs, "Задача добавлена")
                        } else {
                            newCtx.replyWithHTML("На главную", Markup.keyboard([
                                ["Введите новую задачу"],  ["Показать все активные задачи"]]))
                        }
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
                        newCtx.reply('Некорректный ввод. Укажите интервал в минутах')
                    }
                    this.current = 0
                }
                

                if(this.current == 3) {
                    
                    TaskData.updateIdAndGetAll(this.lookingAtId, newCtx.message.text).then((docs) => {
                        if(docs) {
                            this.repopulateArrayAndShow(newCtx, docs, "Задача изменена")
                        } else {
                            newCtx.replyWithHTML("На главную", Markup.keyboard([
                                ["Введите новую задачу"],  ["Показать все активные задачи"]]))
                        }
                    })
                    
                    this.current = 0
                }
            }) 
        })


        this.bot.hears('Введите новую задачу', async (ctx) => {
            this.current = 1
            this.bot.on("text", (newCtx) => {
                if(this.current == 1) {
                    TaskData.saveAndGetAll(newCtx.from.id.toString(), newCtx.message.text).then((docs) => {
                       if(docs) {
                           this.repopulateArrayAndShow(newCtx, docs, "Задача добавлена")
                       } else {
                        newCtx.replyWithHTML("На главную", Markup.keyboard([
                               ["Введите новую задачу"],  ["Показать все активные задачи"]]))
                       }
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
                        newCtx.reply('Некорректный ввод. Укажите интервал в минутах')
                    }
                    this.current = 0
                }

                if(this.current == 3) {
                    TaskData.updateIdAndGetAll(this.lookingAtId, newCtx.message.text).then((docs) => {
                        if(docs) {
                            this.repopulateArrayAndShow(newCtx, docs, "Задача изменена")
                        } else {
                            newCtx.replyWithHTML("На главную", Markup.keyboard([
                                ["Введите новую задачу"],  ["Показать все активные задачи"]]))
                        }
                    })
                    this.current = 0
                }
            })
        })


        this.bot.hears('Убрать напоминание', async (ctx) => {
            if(this.lookingAtId && this.cronMap.has(this.lookingAtId.taskId)) {
                this.lookingAtId ? this.cronMap.get(this.lookingAtId.taskId)?.stop() : ''
                ctx.reply('Напоминание отключено')
                this.cronMap.delete(this.lookingAtId.taskId)
            } else {
                ctx.reply('Сначала установите напоминание')
            }
        })

        this.bot.hears('Добавить напоминание', async (ctx) => {
            this.current = 2
            ctx.reply('Укажите интервал в минутах')
            if(this.lookingAtId && !this.cronMap.has(this.lookingAtId.taskId)) {
                this.bot.on("text", (newCtx) => {
                    if(this.current == 1) {
                        TaskData.saveAndGetAll(newCtx.from.id.toString(), newCtx.message.text).then((docs) => {
                           if(docs) {
                               this.repopulateArrayAndShow(newCtx, docs, "Задача добавлена")
                           } else {
                            newCtx.replyWithHTML("На главную", Markup.keyboard([
                                   ["Введите новую задачу"],  ["Показать все активные задачи"]]))
                           }
                       })
                       this.current = 0
                   }
                if(this.current == 2) {  
                    if(/^\d+$/.test(newCtx.message.text)) {
                        const interval:number = parseInt(newCtx.message.text)
                            
                        const cronJob = new CronJob(`*/${interval} * * * *`, async () => {
                            newCtx.reply(`Напоминаем о задаче: ${this.lookingAtId?.taskContent}`)
                        })
                        this.lookingAtId ? this.cronMap.set(this.lookingAtId.taskId, cronJob) : ''
                        cronJob.start()
                        newCtx.reply(`Напоминание добавлено (${interval} минут)`)
                    } else {
                        newCtx.reply('Некорректный ввод. Укажите интервал в минутах')
                    }
                    this.current = 0
                }

                if(this.current == 3) {
                    TaskData.updateIdAndGetAll(this.lookingAtId, newCtx.message.text).then((docs) => {
                        if(docs) {
                            this.repopulateArrayAndShow(newCtx, docs, "Задача изменена")
                        } else {
                            newCtx.replyWithHTML("На главную", Markup.keyboard([
                                ["Введите новую задачу"],  ["Показать все активные задачи"]]))
                        }
                    })
                    this.current = 0
                }
            })
                
            } else {
                ctx.reply('Напоминалка уже в работе')
            }
            
        })
 }
}