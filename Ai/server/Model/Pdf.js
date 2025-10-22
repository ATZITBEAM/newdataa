import mongoose from "mongoose";

const PdfSchema = new mongoose.Schema({
  filename: String,
  content: String,
});

export const PdfModel = mongoose.model("Pdf", PdfSchema);
