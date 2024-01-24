import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, // The user who is subscribing
            ref: "User", // Reference to the "User" model
        },
        channel: {
            type: Schema.Types.ObjectId, // The user to whom the 'subscriber' is subscribing (channel)
            ref: "User", // Reference to the "User" model
        },
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
