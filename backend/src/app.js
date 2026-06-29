import express from 'express'
import cors from "cors"
import cookieParser from "cookie-parser"

export const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true
}))


app.use(express.json({limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// Imports routes
import userRouter from "./routes/user.routes.js"
import bookingRouter from "./routes/booking.routes.js"

// google Oauth import
import authRouter from "./routes/auth.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/bookings", bookingRouter)
app.use("/api/v1/auth", authRouter)