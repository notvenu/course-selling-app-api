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
        trim: true,
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).length <= 100;
            },
            message: props => `Description exceeds 100 words! You entered "${props.value}".`
        }
    },
    price: {
        type: Number,
        default: 0
    },
    thumbnail: {
        type: String, //Cloudinary URL
        default: ""
    },
    instructorId: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    published: {
        type: Boolean,
        default: false
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: "category"
    }
}, { timestamps: true })

courseSchema.plugin(mongooseAggregatePaginate)

export const Course = mongoose.model("course", courseSchema)