import express from "express";
import dotenv from "dotenv";
import { dbconnection } from "./Config/dbconnection.js";
import router from "./Routes/Ai.js";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

dbconnection();
app.use("/", router);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
