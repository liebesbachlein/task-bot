import { Document, Schema } from 'mongoose'
import { Database } from './init-database'

const COLLECTION_NAME = 'Task'

export interface ITask extends Document {
    taskId: string,
    userId: string,
    taskContent: string
}

const TaskSchema = new Schema<ITask>(
    {
        taskId: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        taskContent: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)

export const TaskModel = Database.mainDatabaseConnection.model<ITask>(COLLECTION_NAME, TaskSchema)
