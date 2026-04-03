import mongoose from 'mongoose'

export async function connectMongo(uri: string | undefined) {
  mongoose.set('strictQuery', true)
  mongoose.set('bufferCommands', false)
  if (!uri) return
  await mongoose.connect(uri)
}
