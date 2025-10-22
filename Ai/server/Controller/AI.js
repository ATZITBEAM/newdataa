import multer from "multer";
import fs from "fs";
import pdf from "pdf-extraction";
import { PdfModel } from "../Model/Pdf.js";

import { GoogleGenAI } from "@google/genai";

import dotenv from "dotenv";

dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const upload = multer({ dest: "uploads/" }).single("file");

// ---------------- Upload PDF ----------------
export const pdfsent = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: "File upload error" });

    try {
      const pdfPath = req.file.path;

      // Extract text using pdf-extraction
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdf(dataBuffer);
      const pdfText = data.text; // contains all text

      // Save to MongoDB
      const savedPdf = await PdfModel.create({
        filename: req.file.originalname,
        content: pdfText,
      });

      fs.unlinkSync(pdfPath); // remove temp file
      res.json({
        message: "PDF uploaded and saved to DB successfully",
        pdfId: savedPdf._id,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error reading PDF file" });
    }
  });
};

// ---------------- Search in PDFs ----------------
export const searchPdf = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const pdfs = await PdfModel.find();
    if (pdfs.length === 0)
      return res.status(404).json({ message: "No PDFs found" });

    const allText = pdfs.map((p) => p.content).join("\n"); // ✅ CORRECT: Get the model instance first

    // Note: Switched to gemini-2.5-flash, which is the recommended up-to-date model for fast, multi-turn chat and flash reasoning.
    const prompt = `
You are a helpful assistant. The following text is from multiple PDFs.
Answer the question **only** using this information.

--- PDF DATA START ---
${allText.slice(0, 1000000)}
--- PDF DATA END ---

User's Question: "${query}"
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: prompt,
    });
    const answer = result.text; // Access the text property directly on the response object

    res.json({ question: query, answer });
  } catch (error) {
    console.error("Gemini Search Error:", error);
    res.status(500).json({ message: "Error generating AI response" });
  }
};
