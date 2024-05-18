import { ConfigService } from '../domains/config'
import { Mongoose } from 'mongoose'

export class Database {
    public static mainDatabaseConnection: Mongoose = new Mongoose()

    public static async initMainDatabaseConnection(): Promise<void> {
        const mongoURL:string = (new ConfigService()).get('MAIN-MONGO-CONNECTION-URL')

        console.log(`Trying to connect to ${mongoURL}`)

        return Database.mainDatabaseConnection
            .connect(mongoURL)
            .then(() => console.log(`Connected to ${mongoURL}`))
            .catch((error) => {
                console.log(`Couldn't connect to ${mongoURL}`)
                throw error
            })
    }
}

export const initDatabase = async (): Promise<void> => {
    await Database.initMainDatabaseConnection()
}
