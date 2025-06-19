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
    module: {
        type: Schema.Types.ObjectId,
        ref: "module"
    },
    videoFile: {
        type: String,
        required: true,
    },
    position: {
        type: Number,
        required: true,
        index: true
    }
}, { timestamps: true })

lessonSchema.plugin(mongooseAggregatePaginate)

export const Lesson = mongoose.model("Lesson", lessonSchema)