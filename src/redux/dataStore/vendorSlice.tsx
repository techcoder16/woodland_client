import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import deleteApi from "@/helper/deleteApi";
import { AppDispatch } from "../store"; // Import AppDispatch for correct dispatch typing

// Define the Vendor type
interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

// Define the state type
interface VendorState {
  vendors: Vendor[];
  totalPages: number;
  loading: boolean;
  error: string | null;
}

// Initial state with correct type
const initialState: VendorState = {
  vendors: [],
  totalPages: 1,
  loading: false,
  error: null,
};

// Fetch vendors from API
export const fetchVendors = createAsyncThunk(
  "vendors/fetchVendors",
  async ({ page, search }: { page: number; search: string }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const params = `?page=${page}&limit=10&search=${search}`;
      const data = await getApi("vendor/getVendors", params, headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch vendors");
    }
  }
);

// Delete vendor
export const deleteVendor = createAsyncThunk<
  void, // No return value
  string, // Accepts a string (vendorId)
  { dispatch: AppDispatch } // ✅ Correctly type `dispatch`
>(
  "vendors/deleteVendor",
  async (vendorId, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      await deleteApi(`vendor/delete/${vendorId}`, headers);

      await (dispatch as AppDispatch)(fetchVendors({ page: 1, search: "" })); // ✅ Fix dispatch typing
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete vendor");
    }
  }
);

// Create slice with correct state handling
const vendorSlice = createSlice({
  name: "vendors",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendors.fulfilled, (state:any, action:any) => {
        state.loading = false;
        state.vendors = action.payload?.vendors || [];
        state.totalPages = action.payload?.totalPages || 1;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch vendors";
      })
      .addCase(deleteVendor.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to delete vendor";
      });
  },
});

export default vendorSlice.reducer;
