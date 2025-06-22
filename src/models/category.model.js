import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
}, { timestamps: true })

categorySchema.plugin(mongooseAggregatePaginate)

export const Category = mongoose.model("Category", categorySchema)