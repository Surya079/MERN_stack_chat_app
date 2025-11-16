import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    // Remove previous handler if exists
    if (get().messageHandler) {
      socket.off("newMessage", get().messageHandler);
    }

    const handler = (newMessage) => {
      const isForThisChat =
        (newMessage.senderId === selectedUser._id &&
          newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id &&
          newMessage.receiverId === selectedUser._id);

      if (!isForThisChat) return;

      set({ messages: [...get().messages, newMessage] });
    };

    socket.on("newMessage", handler);
    set({ messageHandler: handler });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { messageHandler } = get();

    if (messageHandler) socket.off("newMessage", messageHandler);
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
