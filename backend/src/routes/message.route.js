import express from "express";
import { protectRoute } from "../middleware/auth.middlware.js";
import {
  getMessages,
  getUserForSidebar,
  sendMessage,
} from "../controllers/message.controller.js";
import { upload } from "../lib/upload.js";

const router = express.Router();

router.get("/users", protectRoute, getUserForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, upload.single("image"), sendMessage);
export default router;
