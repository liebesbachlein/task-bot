import { Types } from 'mongoose'
import { ITask, TaskModel } from '../db/task.db'

export type TaskType = {
    taskId: string,
    userId: string,
    taskContent: string,
    isComplete: boolean
}


export class TaskData {

    public static async getAll(userId: string): Promise<ITask[]> {
        const allTasks: ITask[] = []
        const docs = await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 })
    
        for(let i = 0; i < docs.length; i ++) {
            allTasks.push(docs[i])
        }
     
        return allTasks
    }

    
    public static async saveAndGetAll(userId: string, taskContent: string): Promise<ITask[] | null> {
        //const dublicate = await TaskModel.findOne({userId: userId, taskContent: taskContent}).exec()

        const docs: ITask[] = await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 })

        for(let i = 0; i < docs.length; i++) {
            if(docs[i].taskContent == taskContent) {
                return null
            }
        }

        const newTask:ITask = await new TaskModel({
            userId: userId,
            taskId: getRandomInt(1000, 9999).toString(),
            taskContent: taskContent,
            isComplete: false
        } as ITask).save()

        docs.push(newTask)

        return docs
    }

    public static async save(userId: string, taskContent: string): Promise<ITask | null> {
        
        const docs: ITask[] = await TaskModel.find({userId: userId}).sort({ "createdAt" : 1 })

        for(let i = 0; i < docs.length; i++) {
            if(docs[i].taskContent == taskContent) {
                return null
            }
        }

        //const doc:ITask | null = await TaskModel.findOne({userId: userId, taskContent: taskContent}).exec()
        
        const newTask:ITask = await new TaskModel({
            userId: userId,
            taskId: getRandomInt(1000, 9999).toString(),
            taskContent: taskContent,
            isComplete: false
        } as ITask).save()
        return newTask
    }

    public static async getTaskId(userId: string, taskContent: string): Promise<string | null> {
        const doc:ITask | null = await TaskModel.findOne({userId: userId, taskContent: taskContent}).exec()

        if (doc) return doc.taskId

        return null
    }


    public static async delete(userId: string, taskContent: string): Promise<void> {
        
        await TaskModel.deleteOne({userId: userId, taskContent: taskContent}).then((res) => {
            if(res) {
                console.log(`User ${userId} deleted task ${taskContent}`)
            }
        })
            
    }

    public static async deleteId(data: TaskType | null): Promise<void> {
        if(!data) {
            return
        }
        await TaskModel.deleteOne({userId: data.userId, taskId: data.taskId})  
    }

    public static async deleteAll(userId: string): Promise<void> {
        await TaskModel.deleteMany({userId: userId})
    }

    public static async updateAndGetAll(data: TaskType | null, newTaskContent: string): Promise<ITask[] | null> {
        if(!data) {
            return null
        }

        const docs: ITask[] = await TaskModel.find({userId: data.userId}).sort({ "createdAt" : 1 })
    
        for(let i = 0; i < docs.length; i ++) {
            if(docs[i].taskId == data.taskId) {
                docs[i].taskContent = newTaskContent
            }
        }

        await TaskModel.updateOne({userId: data.userId, taskId: data.taskId}, {taskContent: newTaskContent}).then((res) => {
            if(res) {
                console.log(`User ${data.userId} updated task ${data.taskId}`)
            }
        })

        return docs
            
    }

}

function getRandomInt(min:number, max:number):number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
  }