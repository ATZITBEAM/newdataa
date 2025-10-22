import express from "express";
import { register } from "../Controller/User.js";

export const userRoutes = express.Router();

userRoutes.post("/register", register);
