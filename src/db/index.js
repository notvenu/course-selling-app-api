import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

export const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("✅ MongoDB connected sucessfully at host: ", connectionInstance.connection.host)
    } catch(error){
        console.error("❌ MongoDB connection failed:", error.message)
        process.exit(1)
    }
}