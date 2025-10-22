app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const dataBuffer = new Uint8Array(fs.readFileSync(pdfPath));

    const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;
    let pdfText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      pdfText += pageText + "\n";
    }

    // delete temp file
    fs.unlinkSync(pdfPath);

    // find or create single record
    let record = await PdfData.findOne();
    if (!record) {
      record = new PdfData({ combinedText: pdfText });
    } else {
      record.combinedText += "\n" + pdfText; // append new data
    }
    await record.save();

    res.json({ message: "✅ PDF added successfully to database" });
  } catch (error) {
    console.error("❌ Error reading PDF:", error);
    res.status(500).json({ message: "Error reading PDF file" });
  }
});
