import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending"
    },
    items: [{
        course: {
            type: Schema.Types.ObjectId,
            ref: "course"
        },
        price: {
            type: Number,
            required: true
        }
    }]
}, { timestamps: true })

orderSchema.pre('save', async function (next) {
  if (!this.isNew && this.status === 'completed') {
    try {
      const original = await this.constructor.findById(this._id).lean()
      const pricesChanged = this.items.some((item, i) => {
        return item.price !== original.items[i]?.price
      })

      if (pricesChanged) {
        return next(new Error("Cannot modify item prices after order is completed."))
      }

      next();
    } catch (err) {
      next(err)
    }
  } else {
    next()
  }
})

orderSchema.plugin(mongooseAggregatePaginate)

export const Order = mongoose.model("Order", orderSchema)