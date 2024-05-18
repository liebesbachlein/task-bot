import { Types } from 'mongoose'
import { IUser, UserModel } from '../db/user.db'

export type SaveUserType = {
    userId: string,
    firstName: string,
    lastName: string,
    username: string
}

export class UserData {
    public static async save(data: SaveUserType): Promise<IUser | null> {
        UserModel.findOne({userId: data.userId}).then((res) => {
            if(!res) {
                console.log(`User ${data.username} added`)
                return new UserModel(data).save()
            } 
        })

        return null
    }

    public static async delete(userId: string): Promise<void> {
        UserModel.deleteOne({userId: userId})
    }
}
