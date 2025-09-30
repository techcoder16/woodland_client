// src/redux/dataStore/managementAgreementSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";

import { AppDispatch } from "../store";
import { post } from "@/helper/api";

// Define the Management Agreement type
export interface ManagementAgreement {
  id: string;
  propertyId: string;
  DateofAgreement: string;
  AgreementStart: string;
  PaymentAgreement: string;
  AgreementEnd: string;
  Frequency: number;
  InventoryCharges: number;
  ManagementFees: number;
  TermsAndCondition: string;
  checkPayableTo:string;
}

interface ManagementAgreementState {
  managementAgreement: ManagementAgreement | null;
  loading: boolean;
  error: string | null;
}

const initialState: ManagementAgreementState = {
  managementAgreement: null,
  loading: false,
  error: null,
};

export const fetchManagementAgreement = createAsyncThunk(
  "managementAgreement/fetchManagementAgreement",
  async ({ propertyId }: { propertyId: string }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const params = `${propertyId}`;
      
      const data = await getApi("property-management/ma", params, headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch management agreement");
    }
  }
);

export const upsertManagementAgreement = createAsyncThunk(
  "managementAgreement/upsertManagementAgreement",
  async (agreementData: ManagementAgreement, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };
      const res = await post("property-management/ma/upsert", agreementData, headers);
      await (dispatch as AppDispatch)(fetchManagementAgreement({ propertyId: agreementData.propertyId }));
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upsert management agreement");
    }
  }
);

const managementAgreementSlice = createSlice({
  name: "managementAgreement",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagementAgreement.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchManagementAgreement.fulfilled, (state, action) => {
        state.loading = false;
        state.managementAgreement = action.payload?.agreement || null;
      })
      .addCase(fetchManagementAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch management agreement";
      })
      .addCase(upsertManagementAgreement.pending, (state) => {
        state.loading = true;
      })
      .addCase(upsertManagementAgreement.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(upsertManagementAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update management agreement";
      });
  },
});

export default managementAgreementSlice.reducer;
