// src/redux/dataStore/supplierSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import postApi from "@/helper/postApi";
import { AppDispatch } from "../store";
import { post } from "@/helper/api";

// Define Supplier type
interface InventoryItem {
  location: string;
  quality: string;
  detail?: string;
  quantity: number;
  condition: string;
}

export interface Supplier {
  id: string;
  propertyId: string;
  electricitySupplier: string;
  electricityPhone: string;
  electricityMeterNo: number;
  electricityReadingOne: number;
  electricityReadingTwo: number;
  gasSupplier: string;
  gasPhone: string;
  gasMeterNo: number;
  gasReadingOne: number;
  gasReadingTwo: number;
  WaterSupplier: string;
  WaterPhone: string;
  WaterMeterNo: number;
  WaterReadingOne: number;
  WaterReadingTwo: number;
  BoroughSupplier: string;
  BoroughPhone: string;
  BoroughMeterNo: number;
  BoroughReadingOne: number;
  BoroughReadingTwo: number;
  inventory: InventoryItem[];
}

// Define Supplier slice state
interface SupplierState {
  supplier: Supplier | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: SupplierState = {
  supplier: null,
  loading: false,
  error: null,
};

// Async thunk to fetch supplier details
export const fetchSupplier = createAsyncThunk(
  "supplier/fetchSupplier",
  async (
    { propertyId }: { propertyId: string },
    { rejectWithValue }
  ) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const params = `${propertyId}`;
      const data = await getApi("property-management/supplier", params, headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch supplier details"
      );
    }
  }
);

// Async thunk to create or update supplier details
export const upsertSupplier = createAsyncThunk(
  "supplier/upsertSupplier",
  async (supplierData: Supplier, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };
      const res = await post("property-management/supplier/upsert", supplierData, headers);
      // Refresh supplier data after updating
      await (dispatch as AppDispatch)(
        fetchSupplier({ propertyId: supplierData.propertyId })
      );
      return res;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to update supplier details"
      );
    }
  }
);

// Create the supplier slice
const supplierSlice = createSlice({
  name: "supplier",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch supplier
    builder.addCase(fetchSupplier.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchSupplier.fulfilled, (state, action) => {
      state.loading = false;
      state.supplier = action.payload?.supplier || null;
    });
    builder.addCase(fetchSupplier.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || "Failed to fetch supplier details";
    });

    // Upsert supplier
    builder.addCase(upsertSupplier.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(upsertSupplier.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
    });
    builder.addCase(upsertSupplier.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || "Failed to update supplier details";
    });
  },
});

export default supplierSlice.reducer;
