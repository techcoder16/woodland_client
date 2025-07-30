import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import deleteApi from "@/helper/deleteApi";
import postApi from "@/helper/postApi"; // Assuming you have a helper for POST requests
import { AppDispatch } from "../store";

// Define the PropertyParty type
interface PropertyParty {
  id?: string;
  propertyId: string;
  tenantId: any[];
  vendorId: string;
}

// Define the state type
interface PropertyPartyState {
  propertyParties: PropertyParty[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: PropertyPartyState = {
  propertyParties: [],
  loading: false,
  error: null,
};

// Upsert PropertyParty
export const upsertPropertyParty = createAsyncThunk(
  "propertyParty/upsert",
  async (partyData: PropertyParty, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      console.log(partyData)
      const {data,error} = await postApi("property-management/party-upsert", partyData, headers);
            console.log(error)
      if (error?.message)
        { 
            return rejectWithValue(error.message || "Failed to upsert Parties");
        }

      return data;
            
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upsert Parties");
    }
  }
);

// Fetch PropertyParty by propertyId
export const fetchPropertyParties = createAsyncThunk(
  "propertyParty/fetch",
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const response = await getApi(`property-management/party/${propertyId}`, "", headers);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch PropertyParty");
    }
  }
);

// Delete PropertyParty
export const deletePropertyParty = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>(
  "propertyParty/delete",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
     const {data,error} =  await deleteApi(`property-management/party/${id}`, headers);

      dispatch(fetchPropertyParties(id)); // Refresh list after deletion


      return data || error
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete PropertyParty");
    }
  }
);

// Create slice
const propertyPartySlice = createSlice({
  name: "propertyParty",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(upsertPropertyParty.pending, (state) => {
        state.loading = true;
      })
      .addCase(upsertPropertyParty.fulfilled, (state, action) => {
        state.loading = false;
          state.propertyParties= action.payload;
        
      })
      .addCase(upsertPropertyParty.rejected, (state, action) => {
        state.loading = false;
            
        state.error = action.payload as string;
      })
      .addCase(fetchPropertyParties.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPropertyParties.fulfilled, (state, action) => {
        state.loading = false;
        state.propertyParties = action.payload || [];
      })
      .addCase(fetchPropertyParties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deletePropertyParty.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePropertyParty.fulfilled, (state) => {
        state.loading = false;
        
      })
      .addCase(deletePropertyParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default propertyPartySlice.reducer;
