import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://api.pexels.com/videos/popular';
const API_KEY = 'MihevV6h15kMrV5KGJCkjCERUB1FMotaNpbZ9tgTcRbXNNI50jz1pOyE';

export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async (page: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, {
        params: { page, per_page: 50 },
        headers: { Authorization: API_KEY },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

interface VideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  fps: number;
  link: string;
  size: number;
}

interface VideoItem {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  image: string;
  user: { id: number; name: string; url: string };
  video_files: VideoFile[];
}

interface VideosState {
  videos: VideoItem[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

const initialState: VideosState = {
  videos: [],
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
};

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    resetVideos: (state) => {
      state.videos = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.videos) {
          state.videos = [...state.videos, ...action.payload.videos];
          state.page = action.payload.page + 1;
          state.hasMore = action.payload.videos.length === 50;
        }
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetVideos } = videoSlice.actions;
export default videoSlice.reducer;
