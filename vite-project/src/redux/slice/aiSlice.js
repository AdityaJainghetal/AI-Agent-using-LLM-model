import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aiApi } from '../../services';

export const sendMessage = createAsyncThunk(
  'ai/send',
  async (payload, { rejectWithValue }) => {
    try {
      const r = await aiApi.send(payload);
      return r.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to send message');
    }
  }
);

export const listChats = createAsyncThunk(
  'ai/list',
  async (_, { rejectWithValue }) => {
    try {
      const r = await aiApi.chats();
      return r.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to load chat history');
    }
  }
);

const slice = createSlice({
  name: 'ai',
  initialState: {
    chats: [],
    currentChat: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentChat: (s, a) => {
      s.currentChat = a.payload;
    },
    resetChat: (s) => {
      s.currentChat = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(sendMessage.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(sendMessage.fulfilled, (s, a) => {
        s.loading = false;
        s.currentChat = a.payload.chat;

        // Keep the sidebar list in sync without a full refetch.
        const updated = a.payload.chat;
        if (updated?._id) {
          const idx = s.chats.findIndex((c) => c._id === updated._id);
          if (idx >= 0) {
            s.chats[idx] = updated;
          } else {
            s.chats.unshift(updated);
          }
        }
      })
      .addCase(sendMessage.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || 'Failed to send message';
      })
      .addCase(listChats.pending, (s) => {
        s.error = null;
      })
      .addCase(listChats.fulfilled, (s, a) => {
        s.chats = a.payload;
      })
      .addCase(listChats.rejected, (s, a) => {
        s.error = a.payload || 'Failed to load chat history';
      });
  },
});

export const { setCurrentChat, resetChat } = slice.actions;
export default slice.reducer;