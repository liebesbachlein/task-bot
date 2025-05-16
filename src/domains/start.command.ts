import { Markup, Telegraf, Scenes, Context } from "telegraf";
import { UserData } from "../data/user.data";
import { TaskData, TaskType, getRandomInt } from "../data/task.data";
import { CronJob } from "cron"
import { ITask} from "db/task.db";
import { ReplyKeyboardMarkup } from "telegraf/typings/core/types/typegram";


export class StartCommand {
    public bot: Telegraf
    public _ctx: Context
    private current: number = 0
    private lookingAtId: TaskType | null = null 
    private cronMap: Map<string, [CronJob, number]> = new Map<string, [CronJob, number]>()
    private MAX_STRING_LENGTH = 35
    private mapTasks: Map<string, string> = new Map<string, string>()
    private toDeleteNotifTaskId: string | null = null

    constructor(bot: Telegraf, ctx: Context) {
        this.bot = bot
        this._ctx = ctx
    }

    populateTaskList(list: ITask[]): string[]{
        const newList:string[] = []
        this.mapTasks.clear()
        for(let i = 0; i < list.length; i++) {
            let task = (i + 1).toString() + '. ' + list[i].taskContent
            if(list[i].taskContent.length > this.MAX_STRING_LENGTH) {
                task = task.substring(0, this.MAX_STRING_LENGTH) + ' . . .'
            }
            if(this.cronMap.has(list[i].taskId)) {
                task = task + ' ' + String.fromCharCode(0x23F0)
            }
            list[i].taskContent = task
            newList.push(task)
            this.mapTasks.set(list[i].taskContent, list[i].taskId)
        } 
    
        newList.splice(0, 0, '--- На главную ---')
        return newList
    }

    repopulateTaskListAndShow(ctx: any, list: ITask[], message: string): void {
        if (list.length == 0) {
            ctx.reply('Нет задач')
        } else {
            ctx.replyWithHTML(message, Markup.keyboard(this.populateTaskList(list)))
        }
    }
    

    goToMain(ctx: Context, message: string): void {
        if(!ctx.chat) {
            ctx.reply('Ошибка')
            return
        }
        ctx.replyWithHTML(message, {
            reply_markup: {
              keyboard: [[ 'Добавить задачу', 'Показать все задачи' ], [ 'Удалить все задачи ' + String.fromCharCode(0x10060)]],
            } as ReplyKeyboardMarkup,
          })
    }


    setUserInputListener(ctx: Context): void {
        this.bot.on("text", async (newCtx):Promise<void> => {
            if(this.current == 1) {

                const res = await TaskData.save(newCtx.from.id.toString(), newCtx.message.text)
                if (res == null) {
                    this.goToMain(newCtx, "Такая задача уже есть")
                } else {
                    this.goToMain(newCtx, "Задача добавлена")
                }
                this.current = 0
            }

            if(this.current == 2) {  
                if(/^\d+$/.test(newCtx.message.text)) {
                    const interval:number = parseInt(newCtx.message.text)
                    if(this.lookingAtId) {
                        const taskContentToRemember = this.lookingAtId?.taskContent
                        this.toDeleteNotifTaskId = this.lookingAtId?.taskId
                        const cronJob = new CronJob(`*/${interval} * * * *`, async () => {
                            newCtx.replyWithHTML(
                                `Напоминаем о задаче: ${taskContentToRemember.substring(3)}`, 
                                Markup.inlineKeyboard([
                                    Markup.button.callback("Задача выполнена", "delete_notification")
                                ]))
                        })
                        this.lookingAtId ? this.cronMap.set(this.lookingAtId.taskId, [cronJob, interval]) : ''
                        cronJob.start()
                        this.lookingAtId.taskId ? this.goToMain(newCtx, `Напоминание добавлено (${interval} минут)`) : ''
                    } else {
                        this.goToMain(newCtx, 'Нет задач')
                    }
                    this.current = 0

                } else {
                    newCtx.reply('Некорректный ввод. Укажите интервал в минутах')
                    this.current = 2
                }
            }
            

            if(this.current == 3) {
                
                TaskData.updateAndGetAll(this.lookingAtId, newCtx.message.text).then((docs) => {
                    if(docs) {
                        /*if(this.cronMap.has(newCtx.message.text)) {
                            const cronData:[CronJob, number] | undefined = this.cronMap.get(newCtx.message.text)
                            const cronJob:CronJob | undefined = cronData?.[0]
                            cronJob?.fireOnTick
                            /*this.cronMap.delete(newCtx.message.text)
                            this.cronMap.set()
                        }*/
                        
                        this.repopulateTaskListAndShow(newCtx, docs, "Задача изменена")
                    } else {
                        this.goToMain(newCtx, "Главная")
                    }
                })
                
                this.current = 0
            }
        }) 
    }

    goToAllTasks(ctx: Context, message: string): void {
        if(!ctx.from) {
            this.goToMain(ctx, 'Ошибка')
            return
        }
        TaskData.getAll(ctx.from.id.toString()).then((res) => {
            const listSize:number = res.length
                if (listSize == 0) {
                    ctx.reply('Нет задач')
                } else {
                    ctx.replyWithHTML(message, Markup.keyboard(
                        this.populateTaskList(res)
                    ))
                }
            })
    }

    handle(): void {    
        UserData.save(
            {
                userId: this._ctx.from ? this._ctx.from.id.toString() : '',
                firstName: this._ctx.from ? this._ctx.from.first_name : '',
                lastName:this._ctx.from ? this._ctx.from.last_name ?? '' : '',
                username: this._ctx.from ? this._ctx.from.username ?? '' : ''
            }
        )
        this.goToMain(this._ctx, "Добро пожаловать в бот")
        
        console.log(`User ${this._ctx.from ? this._ctx.from.id.toString() : '-1'} started the bot`)

        this.bot.hears(/^\d+. /, (ctx) => {
            const message = ctx.message.text
            if(ctx.message.text.endsWith(String.fromCharCode(0x23F0))) {
                const taskId:string= this.mapTasks.get(message) ?? 'Error'
                const interval:number = this.cronMap.get(taskId)?.[1] ?? -1
                ctx.replyWithHTML('Управление задачей (уже установлено напоминание на каждые ' + interval  + ' минут)', Markup.keyboard(
                    [['Изменить', 'Удалить'], 
                    ['Убрать напоминание'], 
                    ['Назад']]))
            } else {
                ctx.replyWithHTML('Управление задачей', Markup.keyboard(
                    [['Изменить', 'Удалить'], 
                    ['Добавить напоминание'], 
                    ['Назад']]))
            }
            
            this.lookingAtId = {
                userId: ctx.from.id.toString(),
                taskId: this.mapTasks.get(message),
                taskContent: message
            } as TaskType
        }) 

        this.bot.hears('Удалить все задачи', async (ctx) => {
            await TaskData.deleteAll(ctx.from.id.toString())
            for(const taskId of this.cronMap.keys()) {
                this.cronMap.get(taskId)?.[0].stop()
            }
            this.mapTasks.clear()
            ctx.reply('Задачи удалены')
        })

        this.bot.hears('Показать все задачи', async (ctx) => {
            TaskData.getAll(ctx.from.id.toString()).then((res) => {
                const listSize:number = res.length
                    if (listSize == 0) {
                        ctx.reply('Нет задач')
                    } else {
                        ctx.replyWithHTML(`${listSize} активных задач`, Markup.keyboard(
                            this.populateTaskList(res)
                        ))
                    }
                })
            })
        
        this.bot.hears('На главную', (ctx) => {
            this.goToMain(ctx, "Главная")
        })

        this.bot.hears('--- На главную ---', (ctx) => {
            this.goToMain(ctx, "Главная")
        })

        this.bot.hears('Назад', (ctx) => {
            TaskData.getAll(ctx.from.id.toString()).then((res) => {
                const listSize:number = res.length
                    if (listSize == 0) {
                        this.goToMain(ctx, "Нет задач")
                    } else {
                        ctx.replyWithHTML(`${listSize} активных задач`, Markup.keyboard(
                            this.populateTaskList(res)
                        ))
                    }
                })
        })

        this.bot.hears('Удалить', async (ctx) => {
            if(this.lookingAtId) {
                await TaskData.deleteId(this.lookingAtId)
                this.lookingAtId ? this.cronMap.get(this.lookingAtId.taskId)?.[0].stop() : ''
                this.mapTasks.delete(this.lookingAtId.taskContent)
                this.goToAllTasks(ctx, "Задача удалена")
            } else {
                this.goToMain(ctx, "Ошибка")
            }     
        })

        this.bot.hears('Изменить', (ctx) => {
            if(!this.lookingAtId) {
                this.goToMain(ctx, "Главная")
            }
            this.current = 3
            ctx.replyWithHTML( 'Введите изменения', {
                reply_markup: ({
                    remove_keyboard: true
                }),
              })
            this.setUserInputListener(ctx)
        })

        this.bot.hears('Некорректный ввод. Укажите интервал в минутах', (ctx) => {
            this.current = 2
            this.setUserInputListener(ctx)
        })

        this.bot.hears("Добавить задачу", async (ctx) => {
            this.current = 1
            ctx.replyWithHTML('Введите задачу', {
                reply_markup: ({
                    remove_keyboard: true
                }),
              })

            this.setUserInputListener(ctx)
        })

        this.bot.action('delete_notification', (ctx) => {
            if(this.toDeleteNotifTaskId && this.cronMap.has(this.toDeleteNotifTaskId)) {
                this.toDeleteNotifTaskId ? this.cronMap.get(this.toDeleteNotifTaskId)?.[0].stop() : ''
                this.cronMap.delete(this.toDeleteNotifTaskId)
                this.toDeleteNotifTaskId ? TaskData.deleteTaskId(ctx.from.id.toString(), this.toDeleteNotifTaskId) : ''
                this.goToMain(ctx, "Задача выполнена")  
                this.toDeleteNotifTaskId = null 
            } else {
                ctx.reply('Сначала установите напоминание')
            }
        })

        this.bot.hears('Убрать напоминание', async (ctx) => {
            if(this.lookingAtId && this.cronMap.has(this.lookingAtId.taskId)) {
                this.lookingAtId ? this.cronMap.get(this.lookingAtId.taskId)?.[0].stop() : ''
                this.cronMap.delete(this.lookingAtId.taskId)
                this.goToMain(ctx, "Напоминание отключено")
            } else {
                ctx.reply('Сначала установите напоминание')
            }
        })

        this.bot.hears('Добавить напоминание', async (ctx) => {
            this.current = 2
            
            if(this.lookingAtId && !this.cronMap.has(this.lookingAtId.taskId)) {
                ctx.replyWithHTML('Укажите интервал в минутах', {
                    reply_markup: ({
                        remove_keyboard: true
                    }),
                  })
                this.setUserInputListener(ctx)
            } else {
                ctx.reply('Напоминание уже в работе')
            }
        })
 }
}