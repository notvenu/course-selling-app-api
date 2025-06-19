import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const moduleSchema = new Schema({
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
                return v.trim().split(/\s+/).length <= 150;
            },
            message: props => `Description exceeds 100 words! You entered "${props.value}".`
        }
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: "course"
    },
    position: {
        type: Number,
        required: true,
        index: true
    }
}, { timestamps: true })

moduleSchema.plugin(mongooseAggregatePaginate)

export const Module = mongoose.model("Module", moduleSchema)