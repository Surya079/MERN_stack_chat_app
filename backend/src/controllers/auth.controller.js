import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "All fileds are required",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be atleast 6 characters",
      });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName,
      email: email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token
      generateToken({ userId: newUser._id }, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    }
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({
        message: "All fields are required",
      });

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Email/user not found",
      });
    }

    const isPassowrdCorrect = await bcrypt.compare(password, user.password);

    if (!isPassowrdCorrect) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }

    generateToken({ userId: user._id }, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }
    console.log(req.file);

    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });

        stream.end(req.file.buffer); // <-- upload buffer
      });

    const uploadResult = await uploadToCloudinary();

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: uploadResult.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (err) {
    console.log("Error updating profile:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in verifu auth controller", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
