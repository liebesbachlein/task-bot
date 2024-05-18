import { Types } from 'mongoose'
import { ITask, TaskModel } from '../db/task.db'

export type TaskType = {
    taskId: string,
    userId: string,
    taskContent: string
}


export class TaskData {
    public static async save(userId: string, taskContent: string): Promise<ITask | null> {
        TaskModel.find({userId: userId}).exec().then((docs) => {
            const taskId: string = (docs.length + 1).toString()
            console.log(`User ${userId} added task ${taskId}`)
            return new TaskModel({
                userId: userId,
                taskId: taskId,
                taskContent: taskContent
            }).save()
        })

        return null
    }

    public static async show(userId: string): Promise<string> {
        let message:string = ''
        await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 }).then((docs) => { 
                for(let i = 0; i < docs.length; i ++) {
                    message += `${i + 1}. ${docs[i].taskContent}\n`
                }
                

                return message
        })

        return message

        

    }

    public static async getAll(userId: string): Promise<ITask[]> {
        const allTasks: ITask[] = []
        const docs = await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 })
    
        for(let i = 0; i < docs.length; i ++) {
            allTasks.push(docs[i])
        }
     
        return allTasks
    }


    public static async saveAndGetAll(userId: string, taskContent: string): Promise<ITask[]> {
        const allTasks: ITask[] = []
        const docs = await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 })

        const newTask = new TaskModel({
            userId: userId,
            taskId: (docs.length + 1).toString(),
            taskContent: taskContent
        }).save()

 
        for(let i = 0; i < docs.length; i ++) {            
            allTasks.push(docs[i])
        }

        allTasks.push({
            userId: userId,
            taskId: (docs.length + 1).toString(),
            taskContent: taskContent
        } as ITask)

        return allTasks
    }

    public static async saveAndShow(userId: string, taskContent: string): Promise<string> {
        TaskModel.find({userId: userId}).exec().then((docs) => {
            const taskId: string = (docs.length + 1).toString()
            console.log(`User ${userId} added task ${taskId}`)
            new TaskModel({
                userId: userId,
                taskId: taskId,
                taskContent: taskContent
            }).save()
        })

        let message:string = ''
        await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 }).then((docs) => { 
                for(let i = 0; i < docs.length; i ++) {
                    message += `${i + 1}. ${docs[i].taskContent}\n`
                }
                new TaskModel({
                    userId: userId,
                    taskId: (docs.length + 1).toString(),
                    taskContent: taskContent
                }).save()

                message += `${docs.length + 1}. ${taskContent}\n`

                return message
        })

        return message

        

    }



    public static async oldest(userId: string): Promise<string> {
        let message:string = ''
        await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 }).limit(1).then((docs) => {
            
            for(let i = 0; i < docs.length; i ++) {
                message += docs[i].taskContent
            }

            return message
        })

        return message

    }

    public static async d (userId: string): Promise<void> {
        
        const docs = await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 }).limit(1)
        await TaskModel.deleteOne({taskId: docs[0].taskId})

    }

    public static async getOldest(userId: string): Promise<string> {
        await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 }).limit(1).then((docs) => {
            
            return docs[0].taskId


        })

        return ''


    }

    public static async delete(userId: string, taskContent: string): Promise<void> {
        
        TaskModel.deleteOne({userId: userId, taskContent: taskContent}).then((res) => {
            if(res) {
                console.log(`User ${userId} deleted task ${taskContent}`)
            }
        })
            
    }

    public static async deleteId(data: TaskType | null): Promise<void> {
        if(!data) {
            return
        }
        TaskModel.deleteOne({userId: data.userId, taskId: data.taskId}).then((res) => {
            if(res) {
                console.log(`User ${data.userId} deleted task ${data.taskId}`)
            }
        })
            
    }

    public static async updateId(data: TaskType | null, newTaskContent: string): Promise<void> {
        if(!data) {
            return
        }
        TaskModel.updateOne({userId: data.userId, taskId: data.taskId}, {taskContent: newTaskContent}).then((res) => {
            if(res) {
                console.log(`User ${data.userId} updated task ${data.taskId}`)
            }
        })
            
    }

    public static async updateIdAndGetAll(data: TaskType | null, newTaskContent: string): Promise<ITask[] | null> {
        if(!data) {
            return null
        }
        const allTasks: ITask[] = []
        const docs = await TaskModel.find({userId: data.userId}).sort({ "createdAt" : 1 })
    
        for(let i = 0; i < docs.length; i ++) {
            if(docs[i].taskId == data.taskId) {
                docs[i].taskContent = newTaskContent
            } 
            
            allTasks.push(docs[i])
        }

        TaskModel.updateOne({userId: data.userId, taskId: data.taskId}, {taskContent: newTaskContent}).then((res) => {
            if(res) {
                console.log(`User ${data.userId} updated task ${data.taskId}`)
            }
        })

        return allTasks
            
    }




}
