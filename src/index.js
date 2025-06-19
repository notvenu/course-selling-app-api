import dotenv from "dotenv"
import { app } from "./app.js"
import { connectDB } from "./db/index.js"

dotenv.config({
    path: "./.env"
})

const startServer = () => {
    connectDB()
    .then(() => {
        app.on("Error", (error) => {
            console.log("❌ Server Error: ", error.message)
            process.exit(1)
        })
        app.listen(process.env.PORT, () => {
            console.log("Server is live at port: ", process.env.PORT)
        })
    })
    .catch((error) => {
        console.error("❌ Failed to connect to database: ", error.message)
        process.exit(1)
    })
}

startServer();