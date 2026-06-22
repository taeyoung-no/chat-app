import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('Room', roomSchema)
