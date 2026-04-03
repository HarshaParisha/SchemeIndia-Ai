import dotenv from 'dotenv'

import { seedSchemeIndiaData } from '../utils/seedSchemeIndiaData.js'
import { connectMongo } from '../utils/mongo.js'

dotenv.config()

await connectMongo(process.env.MONGODB_URI)
await seedSchemeIndiaData()

process.exit(0)

