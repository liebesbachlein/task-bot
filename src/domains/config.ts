import { config, DotenvParseOutput } from "dotenv";

export class ConfigService {
    private config: DotenvParseOutput

    constructor() {
        const {error, parsed} = config()

        if(error) {
            throw new Error('.env not found')
        }

        if(!parsed) {
            throw new Error('.env empty')
        }
        this.config = parsed;
    }
    
    
    get(key: string): string {
        const res = this.config[key]
        if(!res) {
            throw new Error('No such key')
        }
        return res
    }
}