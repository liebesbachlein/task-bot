import { Markup, Telegraf, Scenes, Context } from "telegraf";
import { UserData } from "../data/user.data";
import { TaskData, TaskType } from "../data/task.data";
import { CronJob } from "cron"
import { ITask} from "db/task.db";
import { ReplyKeyboardMarkup } from "telegraf/typings/core/types/typegram";


export class StartCommand {
    public bot: Telegraf
    private current: number = 0
    private lookingAtId: TaskType | null = null 
    private cronMap: Map<string, CronJob> = new Map<string, CronJob>()
    private MAX_STRING_LENGTH = 35
    private mapTasks: Map<string, string> = new Map<string, string>()
    private notificationList: Map<string, number> = new Map<string, number>()

    constructor(bot: Telegraf) {
        this.bot = bot
    }

    populateTaskList(list: ITask[]): string[]{
        const newList:string[] = []
        
        for(let i = 0; i < list.length; i++) {
            let task = (i + 1).toString() + '. ' + list[i].taskContent
            if(list[i].taskContent.length > this.MAX_STRING_LENGTH) {
                task = task.substring(0, this.MAX_STRING_LENGTH) + ' . . .'
            } else {
                //task = task + new Array(this.MAX_STRING_LENGTH - task.length - 2).join('_');
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
        this.bot.telegram.sendMessage(ctx.chat.id, message, {
            reply_markup: {
              keyboard: [[ 'Добавить задачу', 'Показать все задачи' ], [ 'Удалить все задачи' ]],
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
                        const cronJob = new CronJob(`*/${interval} * * * *`, async () => {
                            newCtx.reply(`Напоминаем о задаче: ${taskContentToRemember.substring(3)}`)
                        })
                        this.lookingAtId ? this.cronMap.set(this.lookingAtId.taskId, cronJob) : ''
                        cronJob.start()
                        this.goToMain(ctx, `Напоминание добавлено (${interval} минут)`)
                    } else {
                        this.goToMain(ctx, 'Нет задач')
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
                        this.repopulateTaskListAndShow(newCtx, docs, "Задача изменена")
                    } else {
                        this.goToMain(newCtx, "Главная")
                    }
                })
                
                this.current = 0
            }
        }) 
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

            this.goToMain(_ctx, "Добро пожаловать в бот")
        })

        this.bot.hears(/^\d+. /, (ctx) => {
            const message = ctx.message.text
            ctx.replyWithHTML('Управление задачей', Markup.keyboard(
                [['Изменить', 'Удалить'], 
                ['Добавить напоминание', 'Убрать напоминание'], 
                ['--- На главную ---']]))

            this.lookingAtId = {
                userId: ctx.from.id.toString(),
                taskId: this.mapTasks.get(message),
                taskContent: message
            } as TaskType
        }) 

        this.bot.hears('Удалить все задачи', async (ctx) => {
            await TaskData.deleteAll(ctx.from.id.toString())
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

        this.bot.hears('Удалить', (ctx) => {
            if(this.lookingAtId) {
                
                TaskData.deleteId(this.lookingAtId)
                this.goToMain(ctx, "Задача удалена")
            } else {
                this.goToMain(ctx, "Ошибка")
            }     
            
        })

        this.bot.hears('Изменить', (ctx) => {
            if(!this.lookingAtId) {
                this.goToMain(ctx, "Главная")
            }
            this.current = 3
            this.bot.telegram.sendMessage(ctx.chat.id, 'Введите изменения', {
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
            this.bot.telegram.sendMessage(ctx.chat.id, 'Введите задачу', {
                reply_markup: ({
                    remove_keyboard: true
                }),
              })

            this.setUserInputListener(ctx)
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
            this.bot.telegram.sendMessage(ctx.chat.id, 'Укажите интервал в минутах', {
                reply_markup: ({
                    remove_keyboard: true
                }),
              })
            if(this.lookingAtId && !this.cronMap.has(this.lookingAtId.taskId)) {
                this.setUserInputListener(ctx)
            } else {
                ctx.reply('Напоминалка уже в работе')
            }
            
        })
 }
}