import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const courseSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        default: 0
    },
    thumbnail: {
        type: String, //Cloudinary URL
        default: ""
    },
    instructor: {
        type: Schema.Types.ObjectId,
        ref: "instructor"
    },
    published: {
        type: Boolean,
        default: false
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "category"
    }
}, { timestamps: true })

courseSchema.plugin(mongooseAggregatePaginate)

export const Course = mongoose.model("course", courseSchema)