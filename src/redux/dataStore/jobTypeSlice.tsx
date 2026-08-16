// src/redux/dataStore/jobTypeSlice.tsx
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import { AppDispatch } from "../store";
import { post, patch, del } from "@/helper/api";

export type ReportingStatus = "QUOTING" | "ASSIGNED" | "IN_PROGRESS" | "CONTRACTOR_DONE" | "COMPLETED" | "CANCELLED";

// Define JobType interface
export interface JobType {
  id?: string;
  propertyId: string;
  jobType: string;
  location?: string;
  description: string;
  dueDate: string;
  schedule?: string;
  time?: string;
  startDate?: string;
  endDate?: string;
  thingsToDo?: string;
  employeeId?: string;
  contractorId?: string;
  priority?: string;
  dateDone?: string;
  media?: string[];
  invoice?: string | null;
  totalCost?: number | null;
  totalCharged?: number | null;
  marginPercent?: number | null;
  marginAmount?: number | null;
  status: ReportingStatus;
  createdAt?: string;
  updatedAt?: string;
  employee?: { id: string; first_name?: string; last_name?: string; email?: string };
  contractorRef?: { id: string; name: string; company?: string; phone?: string; email?: string };
  property?: {
    id: string;
    addressLine1?: string;
    addressLine2?: string;
    town?: string;
    postCode?: string;
    propertyTypeCategory?: string;
    vendor?: { id: string; firstName?: string; lastName?: string; phone?: string; email?: string };
  };
}

// Define JobType state type
interface JobTypeState {
  jobTypes: JobType[];
  totalPages: number;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: JobTypeState = {
  jobTypes: [],
  totalPages: 1,
  loading: false,
  error: null,
};

// Fetch JobTypes data from API
export const fetchJobTypes = createAsyncThunk(
  "jobType/fetchJobTypes",
  async (
    { propertyId, page, limit, status, contractorId }: { propertyId?: string; page: number; limit?: number; status?: ReportingStatus; contractorId?: string },
    { rejectWithValue }
  ) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const query = new URLSearchParams({ page: String(page) });
      if (limit) query.set("limit", String(limit));
      if (propertyId) query.set("propertyId", propertyId);
      if (status) query.set("status", status);
      if (contractorId) query.set("contractorId", contractorId);
      const data = await getApi("property-management/job-type", `?${query.toString()}`, headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch job types");
    }
  }
);

// Get JobType by ID
export const fetchJobTypeById = createAsyncThunk(
  "jobType/fetchJobTypeById",
  async (id: string, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const data = await getApi(`property-management/job-type/${id}`, "", headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch job type");
    }
  }
);

// Create JobType
export const createJobType = createAsyncThunk(
  "jobType/createJobType",
  async (jobTypeData: Omit<JobType, 'id'>, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      const res = await post("property-management/job-type", jobTypeData, headers);
      
      // Check for API errors
      if (res.error) {
        return rejectWithValue(res.error.message || "Failed to create job type");
      }
      
      // Refresh the job types list
      await (dispatch as AppDispatch)(fetchJobTypes({
        propertyId: jobTypeData.propertyId,
        page: 1,
      }));

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create job type");
    }
  }
);

// Update JobType
export const updateJobType = createAsyncThunk(
  "jobType/updateJobType",
  async ({ id, jobTypeData }: { id: string; jobTypeData: Partial<JobType> }, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      const res = await post(`property-management/job-type/${id}`, jobTypeData, headers);
      
      // Refresh the job types list
      if (jobTypeData.propertyId) {
        await (dispatch as AppDispatch)(fetchJobTypes({
          propertyId: jobTypeData.propertyId,
          page: 1,
        }));
      }

      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update job type");
    }
  }
);

// Delete JobType
export const deleteJobType = createAsyncThunk(
  "jobType/deleteJobType",
  async ({ id, propertyId }: { id: string; propertyId: string }, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      const res = await post(`property-management/job-type/${id}/delete`, {}, headers);
      
      // Refresh the job types list
      await (dispatch as AppDispatch)(fetchJobTypes({
        propertyId,
        page: 1,
      }));

      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete job type");
    }
  }
);

// Create JobType Slice
const jobTypeSlice = createSlice({
  name: "jobType",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch job types
      .addCase(fetchJobTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobTypes.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.jobTypes = payload?.data?.jobTypes || payload?.jobTypes || [];
        state.totalPages = payload?.data?.totalPages || payload?.totalPages || 1;
      })
      .addCase(fetchJobTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch job types";
      })
      
      // Fetch job type by ID
      .addCase(fetchJobTypeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobTypeById.fulfilled, (state, action) => {
        state.loading = false;
        // Update the specific job type in the array if it exists
        const payload = action.payload as any;
        const jobType = payload?.data?.jobType || payload?.jobType;
        if (jobType) {
          const index = state.jobTypes.findIndex(jt => jt.id === jobType.id);
          if (index !== -1) {
            state.jobTypes[index] = jobType;
          } else {
            state.jobTypes.push(jobType);
          }
        }
      })
      .addCase(fetchJobTypeById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch job type";
      })
      
      // Create job type
      .addCase(createJobType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJobType.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createJobType.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create job type";
      })
      
      // Update job type
      .addCase(updateJobType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJobType.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateJobType.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update job type";
      })
      
      // Delete job type
      .addCase(deleteJobType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteJobType.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteJobType.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete job type";
      });
  },
});

export const { clearError } = jobTypeSlice.actions;
export default jobTypeSlice.reducer;
