/*
class CronJobId {
    private cronJob: CronJob
    public id: string

    constructor() {
        this.id = getRandomInt(1000, 9999).toString()
        this.cronJob = 
    }

    

}

class CronJobManager {
    private taskToCronMap: Map<string, CronJobId> // taskId -> CronJob
    private cronToTaskMap: Map<number, string> = new Map<number, string>() // Cron -> taskId
    
    constructor() {
        this.taskToCronMap = new Map<string, CronJobId>()
        this.cronToTaskMap = new Map<number, string>()
    }

    public deleteCronJob(taskId: string) {
        if(this.taskToCronMap.has(taskId)) {
            this.toDeleteNotifTaskId ? this.cronMap.get(this.toDeleteNotifTaskId)?.[0].stop() : ''
            this.cronMap.delete(this.toDeleteNotifTaskId)
            this.toDeleteNotifTaskId ? TaskData.deleteTaskId(ctx.from.id.toString(), this.toDeleteNotifTaskId) : ''
            this.goToMain(ctx, "Задача выполнена")  
            this.toDeleteNotifTaskId = null 
        }
    }
}

class CronJobId {
    public cronJob:CronJob
    public timeInterval:number
    public id:number
    private callback:Function = () => {}

    constructor(timeInterval:number, id:string) {
        this.timeInterval = timeInterval
        this.id = id

    }

}*/