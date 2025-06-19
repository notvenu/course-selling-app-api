import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const instructorSchema = new Schema({
    courses: [{
        type: Schema.Types.ObjectId,
        ref: "course"
    }],
    instructor: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
}, { timestamps: true })

instructorSchema.plugin(mongooseAggregatePaginate)

export const Instructor = mongoose.model("Instructor", instructorSchema)