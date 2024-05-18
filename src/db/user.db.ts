import { Document, Schema } from 'mongoose'
import { Database } from './init-database'

const COLLECTION_NAME = 'User'

export interface IUser extends Document {
    userId: string,
    firstName: string,
    lastName: string,
    username: string
}

const UserSchema = new Schema<IUser>(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
            default: '',
        },
        lastName: {
            type: String,
            default: '',
        },
        username: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
)

export const UserModel = Database.mainDatabaseConnection.model<IUser>(COLLECTION_NAME, UserSchema)
