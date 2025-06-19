import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        required: true,
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).length <= 50;
            },
            message: props => `Description exceeds 50 words! You entered "${props.value}".`
        }
    }
}, { timestamps: true })

categorySchema.plugin(mongooseAggregatePaginate)

export const Category = mongoose.model("Category", categorySchema)