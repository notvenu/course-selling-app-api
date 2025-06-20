import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const lessonSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).length <= 500;
            },
            message: props => `Content exceeds 100 words! You entered "${props.value}".`
        }
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "course"
    },
    videoFile: {
        type: String,
        required: true,
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

lessonSchema.plugin(mongooseAggregatePaginate)

export const Lesson = mongoose.model("Lesson", lessonSchema)