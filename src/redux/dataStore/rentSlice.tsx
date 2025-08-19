// src/slices/rentSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import postApi from "@/helper/postApi"; // Helper for POST/PUT requests
import { AppDispatch } from "../store";
import { post } from "@/helper/api";

// Define Rent type
interface Rent {
  id: string;
  propertyId: string;
  Amount: string;
  ReceivedOn: string;
  HoldBy: string;
  ReturnedOn: string;
  DateOfAgreement: string;
  Deposit: any;
  NoOfOccupant: number;
  DssRef: string;
  HowFurnished: string;
  Note: string;
  oldRef:string;
  fees:string;
  closed:boolean;
  fees_input:string;
  fees_select:string;
}

// Define Rent state type
interface RentState {
  rents: Rent;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

// Initial state with correct type
const initialState: RentState = {
  rents: null,
  totalPages: 1,
  loading: false,
  error: null,
};

// Fetch Rent data from API
export const fetchRents = createAsyncThunk(
  "rent/fetchRents",
  async ({ propertyId,page, search }: { propertyId :string,page: number; search: string }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const params = `?propertyId=${propertyId}`;
      const data = await getApi("property-management/rent", params, headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch rents");
    }
  }
);

// Upsert Rent (Create/Update)
export const upsertRent = createAsyncThunk(
  "rent/upsertRent",
  async (rentData: Rent, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",

      };

      // rentData.Deposit  = JSON.stringify
      const res = await post("property-management/rent/upsert", rentData);
      // After upserting, refresh the rent list.
      await (dispatch as AppDispatch)(fetchRents({
        page: 1, search: "",
        propertyId: ""
      }));

      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to Update Rent");
    }
  }
);

// Create Rent Slice
const rentSlice = createSlice({
  name: "rent",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch rents
      .addCase(fetchRents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRents.fulfilled, (state, action) => {
        state.loading = false;
        state.rents = action.payload?.rents || [];
        state.totalPages = action.payload?.totalPages || 1;
      })
      .addCase(fetchRents.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch rents";
      })
      // Upsert rent
      .addCase(upsertRent.pending, (state) => {
        state.loading = true;
      })
      .addCase(upsertRent.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(upsertRent.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to upsert rent";
      });
  },
});

export default rentSlice.reducer;
