import { Document, ObjectId, Schema } from 'mongoose'
import { Database } from './init-database'

const COLLECTION_NAME = 'Task'

export interface ITask extends Document {
    taskId: string,
    userId: string,
    taskContent: string,
    isComplete: boolean
}

const TaskSchema = new Schema<ITask>(
    {
        taskId: {
            type: String,
            required: true,
            unique: true
        },
        userId: {
            type: String,
            required: true,
        },
        taskContent: {
            type: String,
            default: '',
        },
        isComplete: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)

export const TaskModel = Database.mainDatabaseConnection.model<ITask>(COLLECTION_NAME, TaskSchema)
