import mongoose, { Schema } from "mongoose"
import bcrpyt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        index: true
    },
    password:  {
        type: String,
        required: [true, "Password is required"],
    },
    role: {
        type: String,
        enum: ["Student", "Instructor"],
        default: "student"
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "lesson"
    },
    refreshToken: {
        type: String,
    }
}, { timestamps: true })

userSchema.pre("save", async (next) => {
    if(this.isModified("password")){
        this.password = await bcrpyt.hash(this.password, 10)
        next()
    }
    next()
})

userSchema.methods.isPasswordCorrect = async (password) => {
    return await bcrpyt.compare(password, this.password)
}

userSchema.methods.generateRefreshToken = () => {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
            role: this.role
        },
        process.env.REFRESH_TOKEN,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateAccessToken = () => {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
            role: this.role
        },
        process.env.ACCESS_TOKEN,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)