import { DEFAULT_COOKIE_GETTER } from "../../helper/Cookie";
import getApi from "../../helper/getApi";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


export const summaryData = createAsyncThunk(
  "summary",
  async (payload:any) => {
    try {
        const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
        const headers = {
            "Authorization": 'Bearer ' + activationToken,
            "Accept": "*/*",
            "Access-Control-Allow-Origin": true
        };

        const response = await getApi('data/summary', JSON.stringify(payload), headers);
        return response;
    } catch (error) {
        console.error("Error in summaryFetch: ", error);
        throw error;
    }
  }
);

const summarySlice = createSlice({
  name: "summary",
  initialState: {
    summary: {} as any,
    loading: false,
    summaryCount: 0,
    error: null,
  },
  reducers: {
    addSummary: (state, action) => {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(summaryData.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(summaryData.rejected, (state, action) => {
        state.loading = true;
      })
      .addCase(summaryData.fulfilled, (state, action) => {
        state.loading = false;

        state.summary = action.payload;
      });
  },
});
export const { addSummary } = summarySlice.actions;
export default summarySlice.reducer;
