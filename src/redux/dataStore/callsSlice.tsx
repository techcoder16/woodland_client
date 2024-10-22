import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const callsData = createAsyncThunk(
  "calls/fetchData",
  async (payload:any) => {
    try {

      const response = await axios.get("http://localhost:5000/api/timers/" + payload.email);
      return response.data; // Extract only the data part of the response
    } catch (error) {
      console.error("Error in fetching calls: ", error);
      throw error;
    }
  }
);

const callsSlice = createSlice({
  name: "calls",
  initialState: {
    calls: [] as any[],
    timers: {} as Record<string, any>,
    loading: false,
    summaryCount: 0,
    error: null as string | null,
  },
  reducers: {
    addCalls: (state, action) => {
      state.calls.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(callsData.pending, (state) => {
        state.loading = true;
      })
      .addCase(callsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error ? action.error.message || "Failed to fetch calls data" : "Failed to fetch calls data";
      })
      .addCase(callsData.fulfilled, (state, action) => {
        state.loading = false;
        state.calls = action.payload.calls; // Store only the serializable data
        state.timers = action.payload.timers; // Store timers data
      });
  },
});

export const { addCalls } = callsSlice.actions;
export default callsSlice.reducer;
