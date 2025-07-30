import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import deleteApi from "@/helper/deleteApi";
import { AppDispatch } from "../store";

interface Property {
  id: string;
  propertyName: string;
  addressLine1: string;
  town: string;
  category: string;
  status: string;
  price: string;
}

interface PropertyState {
  properties: Property[];
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: PropertyState = {
  properties: [],
  totalPages: 1,
  loading: false,
  error: null,
};

export const fetchProperties = createAsyncThunk(
  "properties/fetchProperties",
  async (
    {
      page,
      search,
      category,
      status,
      postCode,
      country,
    }: { page: number; search: string; category?: string; status?: string; postCode?: string; country?: string },
    { rejectWithValue }
  ) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      // Build a query string with available filters
      const params = `?page=${page}&limit=10&search=${search}${
        category ? `&category=${category}` : ""
      }${status ? `&status=${status}` : ""}${postCode ? `&postCode=${postCode}` : ""}${
        country ? `&country=${country}` : ""
      }`;
      const data:any = await getApi("properties", params, headers);
      return data?.items;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch properties");
    }
  }
);

export const deleteProperty = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>(
  "properties/deleteProperty",
  async (propertyId, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      await deleteApi(`properties/${propertyId}`, headers);
      await dispatch(fetchProperties({ page: 1, search: "" }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete property");
    }
  }
);

const propertySlice = createSlice({
  name: "properties",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProperties.fulfilled, (state, action: any) => {
        state.loading = false;
 
        state.properties = action.payload || [];
        state.totalPages = action.payload?.totalPages || 1;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch properties";
      })
      .addCase(deleteProperty.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete property";
      });
  },
});

export default propertySlice.reducer;
