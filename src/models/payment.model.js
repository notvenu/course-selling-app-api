import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const paymentSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: "order"
    },
    paymentMethod: {
        type: String,
        required: true,
        trim: true
    },
    paymentStatus: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionId: {
        type: String,
        required: true
    }
}, { timestamps: true })

paymentSchema.plugin(mongooseAggregatePaginate)

export const Payment = mongoose.model("Payment", paymentSchema)