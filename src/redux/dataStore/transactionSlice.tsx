// src/redux/dataStore/transactionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import {post} from "@/helper/api";
import deleteApi from "@/helper/deleteApi";
import { AppDispatch } from "../store";
import { patch } from "@/helper/api";

export enum StatusTransaction {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT"
}

export interface TransactionResponse {
  transactions?: Transaction[];
  data?: Transaction[];
  total?: number;
  count?: number;
  skip?: number;
  offset?: number;
  take?: number;
  limit?: number;
}

export interface Transaction {
    id?: string; // <-- add this
    status?: StatusTransaction; // Add status field for draft support

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
  totalPages?: number;
  total?: number;
  skip?: number;
  take?: number;
  error: string | null;
}

const initialState: TransactionState = {
  transaction: [],
  loading: false,
  error: null,
  totalPages: 0,
  total: 0,
  skip: 0,
  take: 10
};

// Fetch all transactions for a property with pagination and status filtering
export const fetchTransaction = createAsyncThunk(
  "transaction/fetchTransaction",
  async ({ 
    propertyId, 
    status, 
    skip = 0, 
    take = 10 
  }: { 
    propertyId: string; 
    status?: 'ACTIVE' | 'DRAFT'; 
    skip?: number; 
    take?: number; 
  }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      
      // Build query parameters
      const params = new URLSearchParams({
        propertyId,
        skip: skip.toString(),
        take: take.toString()
      });
      
      if (status) {
        params.append('status', status);
      }
      
      console.log('Fetching transactions with params:', params.toString());
      console.log('API URL:', `${import.meta.env.VITE_API_URL}transaction?${params.toString()}`);
      const data = await getApi('transaction', `?${params.toString()}`, headers) as TransactionResponse;
      console.log('Transaction API response:', data);
      console.log('Response type:', typeof data);
      console.log('Has transactions array:', Array.isArray(data?.transactions));
      
      // Handle different response structures
      let transactions: Transaction[] = [];
      let totalCount = 0;
      let skipValue = 0;
      let takeValue = 10;

      if (Array.isArray(data)) {
        // If data is directly an array
        transactions = data;
        totalCount = data.length;
      } else if (data && typeof data === 'object') {
        // If data is an object with transactions array
        transactions = data.transactions || data.data || [];
        totalCount = data.total || data.count || transactions.length;
        skipValue = data.skip || data.offset || 0;
        takeValue = data.take || data.limit || 10;
      }

      console.log('Processed data:', { transactions: transactions.length, totalCount, skipValue, takeValue });
      
      return {
        transactions,
        total: totalCount,
        skip: skipValue,
        take: takeValue
      };
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
        await patch("transaction", transaction, headers);
      } else {
        // Create
        await post("transaction", transaction, headers);
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
      console.log(id,propertyId)
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      console.log(id,"myid")
      await deleteApi(`transaction/${id}`, headers);

      await (dispatch as AppDispatch)(fetchTransaction({ propertyId }));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete transaction");
    }
  }
);

// Create draft transaction
export const createDraftTransaction = createAsyncThunk(
  "transaction/createDraftTransaction",
  async (transaction: Transaction, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      // Create as draft
      const draftTransaction = { ...transaction, status: StatusTransaction.DRAFT };
      await post("transaction", draftTransaction, headers);

      await (dispatch as AppDispatch)(
        fetchTransaction({ propertyId: transaction.propertyId })
      );
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create draft transaction");
    }
  }
);

// Publish draft transaction
export const publishDraftTransaction = createAsyncThunk(
  "transaction/publishDraftTransaction",
  async (
    { id, propertyId }: { id: string; propertyId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      // Publish draft to active
      await post(`transaction/${id}/publish`, {}, headers);

      await (dispatch as AppDispatch)(
        fetchTransaction({ propertyId })
      );
      return;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to publish draft transaction");
    }
  }
);

// Get draft transactions (using drafts endpoint)
export const getDraftTransactions = createAsyncThunk(
  "transaction/getDraftTransactions",
  async ({ 
    propertyId, 
    skip = 0, 
    take = 10 
  }: { 
    propertyId: string; 
    skip?: number; 
    take?: number; 
  }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      
      const params = new URLSearchParams({
        propertyId,
        skip: skip.toString(),
        take: take.toString()
      });
      
      const data = await getApi('transaction/drafts', `?${params.toString()}`, headers) as TransactionResponse;
      return {
        transactions: data?.transactions || [],
        total: data?.total || 0,
        skip: data?.skip || 0,
        take: data?.take || 10
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch draft transactions");
    }
  }
);

// Get active transactions (using main endpoint with status filter)
export const getActiveTransactions = createAsyncThunk(
  "transaction/getActiveTransactions",
  async ({ 
    propertyId, 
    skip = 0, 
    take = 10 
  }: { 
    propertyId: string; 
    skip?: number; 
    take?: number; 
  }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      
      const params = new URLSearchParams({
        propertyId,
        skip: skip.toString(),
        take: take.toString(),
        status: 'ACTIVE'
      });
      
      const data = await getApi('transaction', `?${params.toString()}`, headers) as TransactionResponse;
      return {
        transactions: data?.transactions || [],
        total: data?.total || 0,
        skip: data?.skip || 0,
        take: data?.take || 10
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch active transactions");
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
        if (action.payload) {
          state.transaction = action.payload.transactions || [];
          state.total = action.payload.total || 0;
          state.skip = action.payload.skip || 0;
          state.take = action.payload.take || 10;
          state.totalPages = Math.ceil((action.payload.total || 0) / (action.payload.take || 10));
        } else {
          state.transaction = [];
          state.total = 0;
          state.skip = 0;
          state.take = 10;
          state.totalPages = 0;
        }
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
      })
      // Create Draft
      .addCase(createDraftTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDraftTransaction.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createDraftTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Publish Draft
      .addCase(publishDraftTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(publishDraftTransaction.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(publishDraftTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Draft Transactions
      .addCase(getDraftTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDraftTransactions.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.transaction = action.payload.transactions || [];
          state.total = action.payload.total || 0;
          state.skip = action.payload.skip || 0;
          state.take = action.payload.take || 10;
          state.totalPages = Math.ceil((action.payload.total || 0) / (action.payload.take || 10));
        }
      })
      .addCase(getDraftTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Active Transactions
      .addCase(getActiveTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getActiveTransactions.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.transaction = action.payload.transactions || [];
          state.total = action.payload.total || 0;
          state.skip = action.payload.skip || 0;
          state.take = action.payload.take || 10;
          state.totalPages = Math.ceil((action.payload.total || 0) / (action.payload.take || 10));
        }
      })
      .addCase(getActiveTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default transactionSlice.reducer;
