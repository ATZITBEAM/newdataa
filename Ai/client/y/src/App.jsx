import React, { useState } from "react";

const App = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [pdf, setPdf] = useState(null);

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/search?query=${search}`
      );
      const data = await response.json();

      setResults(data.answer);
    } catch (error) {
      console.error("Search error:", error);
    }
  };
  const handleUpload = async () => {
    if (!pdf) {
      alert("Please select a PDF first!");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdf);

    try {
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      alert("PDF uploaded successfully!");
      console.log("Upload Response:", data);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div style={{ padding: 50 }}>
      <h1>📚 PDF Search Engine</h1>
      <input
        style={{ height: "40px", width: "400px", fontSize: "16px" }}
        type="text"
        placeholder="Type your search..."
        onChange={(e) => setSearch(e.target.value)}
      />
      <button onClick={handleSearch} style={{ marginLeft: 10, height: "45px" }}>
        Search
      </button>

      <div style={{ marginTop: 20 }}>
        <p>{results}</p>
      </div>
      <hr style={{ margin: "30px 0" }} />

      {/* File Upload Section */}
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setPdf(e.target.files[0])}
      />
      <button onClick={handleUpload} style={{ marginLeft: 10 }}>
        Upload PDF
      </button>
    </div>
  );
};

export default App;
