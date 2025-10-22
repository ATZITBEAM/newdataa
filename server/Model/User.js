import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
  },
});

export const user = mongoose.model("user", userSchema);
