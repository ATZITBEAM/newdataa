import mongoose from "mongoose";

export const dbconnection = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/test");
    console.log("db connect");
  } catch (error) {
    console.log("not connect");
  }
};
