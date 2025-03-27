// src/redux/dataStore/tenancyAgreementSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import postApi from "@/helper/postApi";
import { AppDispatch } from "../store";

// Define the Tenancy Agreement type
export interface TenancyAgreement {
  id: string;
  propertyId: string;
  tenantId: string;
  details: string;
  housingAct: string;
  LetterType: string;
  TermsandCondition: string;
  Guaranteer: string;
  Address1: string;
  Address2?: string;
  HideLandlordAdress: boolean;
  signedDate?: string;
}

interface TenancyAgreementState {
  tenancyAgreement: TenancyAgreement | null;
  loading: boolean;
  error: string | null;
}

const initialState: TenancyAgreementState = {
  tenancyAgreement: null,
  loading: false,
  error: null,
};

export const fetchTenancyAgreement = createAsyncThunk(
  "tenancyAgreement/fetchTenancyAgreement",
  async ({ propertyId }: { propertyId: string }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const params = `${propertyId}`;
      console.log(params)
      const data = await getApi("manager/getTenancyAgreement", params, headers);
      console.log(data,"sda")
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch tenancy agreement");
    }
  }
);

export const upsertTenancyAgreement = createAsyncThunk(
  "tenancyAgreement/upsertTenancyAgreement",
  async (agreementData: TenancyAgreement, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };
      console.log(agreementData)
      const res = await postApi("manager/tenancyAgreement", agreementData, headers);
      await (dispatch as AppDispatch)(fetchTenancyAgreement({ propertyId: agreementData.propertyId }));
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upsert tenancy agreement");
    }
  }
);

const tenancyAgreementSlice = createSlice({
  name: "tenancyAgreement",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenancyAgreement.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTenancyAgreement.fulfilled, (state, action) => {
        state.loading = false;
        console.log(action.payload.tenancyAgreement)
        state.tenancyAgreement = action.payload?.agreement || null;
      })
      .addCase(fetchTenancyAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch tenancy agreement";
      })
      .addCase(upsertTenancyAgreement.pending, (state) => {
        state.loading = true;
      })
      .addCase(upsertTenancyAgreement.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(upsertTenancyAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update tenancy agreement";
      });
  },
});

export default tenancyAgreementSlice.reducer;
