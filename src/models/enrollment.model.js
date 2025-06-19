import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const enrollmentSchema = new Schema({
    courses: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    student: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

enrollmentSchema.plugin(mongooseAggregatePaginate)

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema)