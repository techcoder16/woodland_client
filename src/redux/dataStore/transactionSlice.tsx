// src/redux/dataStore/transactionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import postApi from "@/helper/postApi";
import deleteApi from "@/helper/deleteApi";
import { AppDispatch } from "../store";
import { patch } from "@/helper/api";

export interface Transaction {
  propertyId: string;
  Branch: string;
  fromTenantDate?: string;
  fromTenantMode?: string;
  fromTenantOtherDebit?: number;
  fromTenantBenefit1?: string;
  fromTenantBenefit2?: string;
  fromTenantRentReceived?: number;
  fromTenantDescription?: string;
  fromTenantReceivedBy?: string;
  fromTenantPrivateNote?: string;
  tenantTotalCredit?: number;
  tenantUpToDateRent?: number;
  tenantNetOutstanding?: number;
  tenantDueDate?: string;
  grossProfit?: number;
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
  landlordNetRentReceived?: number;
  landlordNetDeductions?: number;
  landlordNetToBePaid?: number;
  landlordNetPaid?: number;
  landlordPaidBy:string;
  landlordNetDebit?: number;
}

interface TransactionState {
  transaction: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transaction: [],
  loading: false,
  error: null,
};

// Fetch all transactions for a property
export const fetchTransaction = createAsyncThunk(
  "transaction/fetchTransaction",
  async ({ propertyId }: { propertyId: string }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const params = `propertyId=${propertyId}`;
      const data = await getApi("manager/getTransactions", params, headers);
      return data?.transaction || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch transactions");
    }
  }
);

// Upsert (Create or Update) transaction
export const upsertTransaction = createAsyncThunk(
  "transaction/upsertTransaction",
  async (transaction: Transaction, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      if (transaction.id) {
        // Update
        await patch("property-management/transaction", transaction, headers);
      } else {
        // Create
        await postApi("property-management/transaction", transaction, headers);
      }

      await (dispatch as AppDispatch)(
        fetchTransaction({ propertyId: transaction.propertyId })
      );
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save transaction");
    }
  }
);

// Delete transaction
export const deleteTransaction = createAsyncThunk(
  "transaction/deleteTransaction",
  async (
    { id, propertyId }: { id: string; propertyId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      await deleteApi(`property-management/transaction/${id}`, headers);

      await (dispatch as AppDispatch)(fetchTransaction({ propertyId }));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete transaction");
    }
  }
);

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transaction = action.payload;
      })
      .addCase(fetchTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upsert
      .addCase(upsertTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(upsertTransaction.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(upsertTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTransaction.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default transactionSlice.reducer;
