import express from "express";
import {
  login,
  logout,
  signup,
  updateProfile,
  verifyAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middlware.js";
import { upload } from "../lib/upload.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put(
  "/update-profile",
  protectRoute,
  upload.single("profilePic"),
  updateProfile
);

router.get("/verify", protectRoute, verifyAuth);
export default router;
