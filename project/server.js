import express from "express";
import { dbconnection } from "./Config/dbconnection.js";

const app = express();
const port = process.env.PORT || 5000;
dbconnection();
app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
