import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUserForSidebar = async (req, res) => {
  try {
    const loggedInUserid = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserid },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in Get users in message controller", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in Get  messages in messages controller", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const myId = req.user._id;
    const image = req?.file;

    let imageUrl = null;
    if (image) {
      const buffer = image.buffer;
      const uploadToCloudinary = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream((err, result) => {
            if (err) reject(err);
            else resolve(result);
          });

          stream.end(buffer); // <-- upload buffer
        });
      const uploadResult = await uploadToCloudinary();
      imageUrl = uploadResult.secure_url;
    }

    const newMessage = new Message({
      senderId: myId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // todo : realtime chat functionality using socket.io
    // 🔥 REALTIME MESSAGE SEND
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    

    res.status(201).json(newMessage);
  } catch (error) {
    console.log(error);

    console.log("Error in send message in messages controller", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
