import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const enrollmentSchema = new Schema({
    course: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    rating: {
        type: [Number, 1, 5],
        required: true,
        index: true
    },
    review: {
        type: String,
        default: "",
        validate: {
            validator: function (v) {
                return v.trim().split(/\s+/).length <= 100;
            },
            message: props => `Review exceeds 100 words! You entered "${props.value}".`
        }
    }
}, { timestamps: true })

enrollmentSchema.plugin(mongooseAggregatePaginate)

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema)