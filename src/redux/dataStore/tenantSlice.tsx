import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import deleteApi from "@/helper/deleteApi";
import { AppDispatch } from "../store"; // Import AppDispatch for correct dispatch typing
import { ReactNode } from "react";

// Define the tenant type
interface tenant {
  [x: string]: ReactNode;
  MobileNo: ReactNode;
  title: ReactNode;
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

// Define the state type
interface TenantState {
  tenants: tenant[];
  totalPages: number;
  loading: boolean;
  error: string | null;
}

// Initial state with correct type
const initialState: TenantState = {
  tenants: [],
  totalPages: 1,
  loading: false,
  error: null,
};

// Fetch tenants from API
export const fetchtenants = createAsyncThunk(
  "tenants/fetchtenants",
  async ({ page, search }: { page: number; search: string }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const params = `?page=${page}&limit=10&search=${search}`;
      const data = await getApi("tenant/tenants", params, headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch tenants");
    }
  }
);

// Delete tenant
export const deleteTenant = createAsyncThunk<
  void, // No return value
  string, // Accepts a string (TenantId)
  { dispatch: AppDispatch } // ✅ Correctly type `dispatch`
>(
  "tenants",
  async (TenantId, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
     const {data,error} =  await deleteApi(`tenant/delete/${TenantId}`, headers);
  
      await (dispatch as AppDispatch)(fetchtenants({ page: 1, search: "" })); // ✅ Fix dispatch typing


      if (error?.message) {
        return rejectWithValue(error.message); // Properly returning error message
      }



    } catch (error: any) {
      console.log(error,"ASDasd")
      return rejectWithValue(error.message || "Failed to delete tenant");
    }
  }
);

// Create slice with correct state handling
const tenantslice = createSlice({
  name: "tenants",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchtenants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchtenants.fulfilled, (state:any, action:any) => {
        state.loading = false;
        state.tenants = action.payload?.tenants || [];
        state.totalPages = action.payload?.totalPages || 1;
      })
      .addCase(fetchtenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch tenants";
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
    
        state.loading = false;
        state.error = null; // Clear error on success
      })
      .addCase(deleteTenant.rejected, (state, action) => {
       
        state.loading = false;
        state.error = action.payload as string || "Failed to delete tenant";
      });
  },
});

export default tenantslice.reducer;
