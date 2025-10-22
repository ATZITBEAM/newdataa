import express from "express";
import { pdfsent, searchPdf } from "../Controller/AI.js";

const router = express.Router();
router.post("/upload", pdfsent);
router.get("/search", searchPdf);

export default router;
