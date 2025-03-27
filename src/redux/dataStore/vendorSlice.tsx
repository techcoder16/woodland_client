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
  selectedVendor: any | null; // ✅ Added to store a single vendor
  totalPages: number;
  loading: boolean;
  error: string | null;
  vendorLoading:boolean;
}

// Initial state with correct type
const initialState: VendorState = {
  vendors: [],
  selectedVendor: null, // ✅ Initial value for single vendor
  totalPages: 1,
  loading: false,
  error: null,
  vendorLoading:false

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

// Fetch vendor by ID
export const getVendorById = createAsyncThunk(
  "vendors/getVendorById",
  async (vendorId: string, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const data = await getApi(`vendor/getVendorById/${vendorId}`, "", headers);
      console.log(data,"furqan")
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch vendor");
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
     const {data,error} =  await deleteApi(`vendor/delete/${vendorId}`, headers);

      await (dispatch as AppDispatch)(fetchVendors({ page: 1, search: "" })); // ✅ Fix dispatch typing

      
      if (error?.message) {
        console.log(error.message)
        return rejectWithValue(error.message); // Properly returning error message
      }


      
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
      // Fetch Vendors List
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload?.vendors || [];
        state.totalPages = action.payload?.totalPages || 1;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch vendors";
      })

      // Fetch Vendor by ID ✅ Corrected
      .addCase(getVendorById.pending, (state) => {
        
        state.vendorLoading = true;
      })
      .addCase(getVendorById.fulfilled, (state, action) => {
        console.log(action.payload,"furqan1")
        state.vendorLoading = false;
        state.selectedVendor = action.payload || null; // ✅ Store single vendor
      })
      .addCase(getVendorById.rejected, (state, action) => {
        state.vendorLoading = false;
        state.error = action.payload as string || "Failed to fetch vendor";
      })

      // Delete Vendor
      .addCase(deleteVendor.fulfilled, (state) => {
        state.vendorLoading = false;
        state.error = null;
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        state.vendorLoading = false;
        console.log(action.payload)
        state.error = action.payload as string || "Failed to delete vendor";

      });
  },  
});

export default vendorSlice.reducer;
