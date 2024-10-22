import { DEFAULT_COOKIE_GETTER } from "../../helper/Cookie";
import getApi from "../../helper/getApi";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";


export const detailData = createAsyncThunk(
  "details",
  async (payload:any) => {
    try {
        const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
        const headers = {
            "Authorization": 'Bearer ' + activationToken,
            "Accept": "*/*",
            "Access-Control-Allow-Origin": true
        };
    
        const response = await getApi('data/detail_summary', JSON.stringify(payload), headers);
        return response;
    } catch (error) {
        console.error("Error in detail summary Fetch: ", error);
        throw error;
    }
  }
);

const detailSlice = createSlice({
  name: "details",
  initialState: {
    details: {} as any,
    loading: false,
    detailCount: 0,
    error: null,
  },
  reducers: {
    addDetails: (state, action) => {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(detailData.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(detailData.rejected, (state, action) => {
        state.loading = true;
      })
      .addCase(detailData.fulfilled, (state, action) => {
        state.loading = false;

        state.details = action.payload;
      });
  },
});
export const { addDetails } = detailSlice.actions;
export default detailSlice.reducer;
