import { Types } from 'mongoose'
import { ITask, TaskModel } from '../db/task.db'

export type SaveTaskType = {
    userId: string,
    taskId: string,
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
}
