// src/redux/dataStore/transactionSlice.ts

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import postApi from "@/helper/postApi";
import { AppDispatch } from "../store";

/**
 * 1) Define the Transaction interface.
 *    These fields should match the ones in your Zod schema and component.
 *    Adjust as needed for your real data model.
 */
export interface Transaction {
  propertyId: string;

  Branch: string;

  // From Tenant Section
  fromTenantDate?: string;
  fromTenantMode?: string;
  fromTenantOtherDebit?: number;
  fromTenantBenefit1?: string;
  fromTenantBenefit2?: string;
  fromTenantRentReceived?: number;
  fromTenantDescription?: string;
  fromTenantReceivedBy?: string;
  fromTenantPrivateNote?: string;

  // Tenant Section
  tenantTotalCredit?: number;
  tenantUpToDateRent?: number;
  tenantNetOutstanding?: number;
  tenantDueDate?: string;

  // Gross Profit
  grossProfit?: number;

  // To Landlord Section
  toLandlordDate?: string;
  toLandlordRentReceived?: number;
  toLandlordLeaseManagementFees?: number;
  toLandlordLeaseBuildingExpenditure?: number;
  toLandlordNetReceived?: number;
  toLandlordLessVAT?: number;
  toLandlordNetPaid?: number;
  toLandlordChequeNo?: string;
  toLandlordDefaultExpenditure?: string;
  toLandlordExpenditureDescription?: string;
  toLandlordFundBy?: string;

  // Landlord Section
  landlordNetRentReceived?: number;
  landlordNetDeductions?: number;
  landlordNetToBePaid?: number;
  landlordNetPaid?: number;
  landlordNetDebit?: number;
}

/**
 * 2) Define the slice state
 */
interface TransactionState {
  transactionData: Transaction | null;
  loading: boolean;
  error: string | null;
}

/**
 * 3) Initial state
 */
const initialState: TransactionState = {
  transactionData: null,
  loading: false,
  error: null,
};

/**
 * 4) Async Thunk: fetchTransaction
 *    - propertyId is passed as an argument to fetch the relevant transaction data.
 *    - Adjust the endpoint and params as needed.
 */
export const fetchTransaction = createAsyncThunk(
  "transaction/fetchTransaction",
  async (
    { propertyId }: { propertyId: string },
    { rejectWithValue }
  ) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      // Example: GET /manager/getTransaction?propertyId=xxxx
      const params = `propertyId=${propertyId}`;
      const data = await getApi("manager/getTransaction", params, headers);
      return data; // data should include e.g. { transactionData: {...} }
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch transaction data"
      );
    }
  }
);

/**
 * 5) Async Thunk: upsertTransaction
 *    - Called to create or update transaction data.
 *    - Adjust the endpoint as needed (e.g., "manager/transaction").
 */
export const upsertTransaction = createAsyncThunk(
  "transaction/upsertTransaction",
  async (transaction: Transaction, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };
      // Example: POST or PUT /manager/transaction
      const res = await postApi("manager/transaction", transaction, headers);

      // After upserting, refresh the transaction data
      await (dispatch as AppDispatch)(
        fetchTransaction({ propertyId: transaction.propertyId })
      );
      return res;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to upsert transaction data"
      );
    }
  }
);

/**
 * 6) Create the transactionSlice
 */
const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchTransaction
      .addCase(fetchTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransaction.fulfilled, (state, action) => {
        state.loading = false;
        // Adjust if your API returns a different shape
        state.transactionData = action.payload?.transactionData || null;
      })
      .addCase(fetchTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch transaction data";
      })

      // upsertTransaction
      .addCase(upsertTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(upsertTransaction.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(upsertTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to upsert transaction data";
      });
  },
});

export default transactionSlice.reducer;
