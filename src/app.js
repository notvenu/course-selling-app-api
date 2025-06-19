import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

//Configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))
app.use(express.json({
    limit: "32kb"
}))
app.use(express.urlencoded({
    limit: "32kb"
}))
app.use(express.static("public"))
app.use(cookieParser())

export { app }