import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { get, post, patch, del } from "@/helper/api";

export interface HistoryEntry {
  id?: string;
  propertyId: string;
  dated: string;
  jobType?: string;
  jobDone?: string;
  subject?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Termination {
  id?: string;
  propertyId: string;
  finalElectricityReading?: string;
  finalGasReading?: string;
  finalWaterReading?: string;
  depositClearedOn?: string;
  newAddressOfTenant?: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  termination: Termination | null;
  loading: boolean;
  terminationLoading: boolean;
  error: string | null;
}

const initialState: HistoryState = {
  entries: [],
  termination: null,
  loading: false,
  terminationLoading: false,
  error: null,
};

export const fetchHistory = createAsyncThunk(
  "history/fetchHistory",
  async (propertyId: string, { rejectWithValue }) => {
    const { data, error } = await get<any>(`property-management/history?propertyId=${propertyId}`);
    if (error) return rejectWithValue((error as any).message || "Failed to fetch history");
    return data;
  }
);

export const createHistoryEntry = createAsyncThunk(
  "history/createEntry",
  async (entryData: Omit<HistoryEntry, "id">, { dispatch, rejectWithValue }) => {
    const { data, error } = await post<any>("property-management/history", entryData);
    if (error) return rejectWithValue((error as any).message || "Failed to create entry");
    await dispatch(fetchHistory(entryData.propertyId));
    return data;
  }
);

export const updateHistoryEntry = createAsyncThunk(
  "history/updateEntry",
  async ({ id, entryData }: { id: string; entryData: Partial<HistoryEntry> }, { dispatch, rejectWithValue }) => {
    const { data, error } = await patch<any>(`property-management/history/${id}`, entryData);
    if (error) return rejectWithValue((error as any).message || "Failed to update entry");
    if (entryData.propertyId) await dispatch(fetchHistory(entryData.propertyId));
    return data;
  }
);

export const deleteHistoryEntry = createAsyncThunk(
  "history/deleteEntry",
  async ({ id }: { id: string; propertyId: string }, { rejectWithValue }) => {
    const { error } = await del<any>(`property-management/history/${id}`);
    if (error) return rejectWithValue((error as any).message || "Failed to delete entry");
    return id;
  }
);

export const fetchTermination = createAsyncThunk(
  "history/fetchTermination",
  async (propertyId: string, { rejectWithValue }) => {
    const { data, error } = await get<any>(`property-management/termination?propertyId=${propertyId}`);
    if (error) return rejectWithValue((error as any).message || "Failed to fetch termination");
    return data;
  }
);

export const saveTermination = createAsyncThunk(
  "history/saveTermination",
  async (terminationData: Termination, { dispatch, rejectWithValue }) => {
    const endpoint = terminationData.id
      ? `property-management/termination/${terminationData.id}`
      : "property-management/termination";
    const fn = terminationData.id ? patch : post;
    const { data, error } = await fn<any>(endpoint, terminationData);
    if (error) return rejectWithValue((error as any).message || "Failed to save termination");
    await dispatch(fetchTermination(terminationData.propertyId));
    return data;
  }
);

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.entries = payload?.entries || payload?.data?.entries || payload || [];
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createHistoryEntry.pending, (state) => { state.loading = true; })
      .addCase(createHistoryEntry.fulfilled, (state) => { state.loading = false; })
      .addCase(createHistoryEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateHistoryEntry.pending, (state) => { state.loading = true; })
      .addCase(updateHistoryEntry.fulfilled, (state) => { state.loading = false; })
      .addCase(updateHistoryEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteHistoryEntry.pending, (state) => { state.loading = true; })
      .addCase(deleteHistoryEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.filter((e) => e.id !== action.payload);
      })
      .addCase(deleteHistoryEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTermination.pending, (state) => { state.terminationLoading = true; })
      .addCase(fetchTermination.fulfilled, (state, action) => {
        state.terminationLoading = false;
        const payload = action.payload as any;
        state.termination = payload?.termination || payload?.data || payload || null;
      })
      .addCase(fetchTermination.rejected, (state) => { state.terminationLoading = false; })
      .addCase(saveTermination.pending, (state) => { state.terminationLoading = true; })
      .addCase(saveTermination.fulfilled, (state) => { state.terminationLoading = false; })
      .addCase(saveTermination.rejected, (state) => { state.terminationLoading = false; });
  },
});

export default historySlice.reducer;
