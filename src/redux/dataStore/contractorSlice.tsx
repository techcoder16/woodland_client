import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { get, post, patch, del } from "@/helper/api";
import { AppDispatch } from "../store";

export interface Contractor {
  id: string;
  name: string;
  company?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
  country?: string;
}

interface ContractorState {
  contractors: Contractor[];
  selectedContractor: Contractor | null;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: ContractorState = {
  contractors: [],
  selectedContractor: null,
  totalPages: 1,
  loading: false,
  error: null,
};

export const fetchContractors = createAsyncThunk(
  "contractors/fetchContractors",
  async ({ page, search }: { page: number; search: string }, { rejectWithValue }) => {
    const { data, error } = await get<any>(`contractor/getContractors?page=${page}&limit=10&search=${search}`);
    if (error) {
      return rejectWithValue(error.message || "Failed to fetch contractors");
    }
    return data;
  }
);

export const getContractorById = createAsyncThunk(
  "contractors/getContractorById",
  async (contractorId: string, { rejectWithValue }) => {
    const { data, error } = await get<Contractor>(`contractor/getContractorById/${contractorId}`);
    if (error) {
      return rejectWithValue(error.message || "Failed to fetch contractor");
    }
    return data;
  }
);

export const createContractor = createAsyncThunk(
  "contractors/createContractor",
  async (contractorData: Omit<Contractor, "id">, { rejectWithValue }) => {
    const { data, error } = await post<any>("contractor/create", contractorData);
    if (error) {
      return rejectWithValue(error.message || "Failed to create contractor");
    }
    return data;
  }
);

export const updateContractor = createAsyncThunk(
  "contractors/updateContractor",
  async ({ id, contractorData }: { id: string; contractorData: Partial<Contractor> }, { rejectWithValue }) => {
    const { data, error } = await patch<any>(`contractor/update/${id}`, contractorData);
    if (error) {
      return rejectWithValue(error.message || "Failed to update contractor");
    }
    return data;
  }
);

export const deleteContractor = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>(
  "contractors/deleteContractor",
  async (contractorId, { dispatch, rejectWithValue }) => {
    const { error } = await del(`contractor/delete/${contractorId}`);
    if (error) {
      return rejectWithValue(error.message || "Failed to delete contractor");
    }
    await dispatch(fetchContractors({ page: 1, search: "" }));
  }
);

const contractorSlice = createSlice({
  name: "contractors",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContractors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContractors.fulfilled, (state, action: any) => {
        state.loading = false;
        state.contractors = action.payload?.contractors || [];
        state.totalPages = action.payload?.totalPages || 1;
      })
      .addCase(fetchContractors.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch contractors";
      })

      .addCase(getContractorById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getContractorById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedContractor = action.payload || null;
      })
      .addCase(getContractorById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch contractor";
      })

      .addCase(deleteContractor.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to delete contractor";
      });
  },
});

export default contractorSlice.reducer;
