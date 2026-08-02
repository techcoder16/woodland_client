import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get, post } from '../../helper/api';

// Types
interface DashboardStats {
  totalProperties: number;
  publishedProperties: number;
  draftProperties: number;
  totalTenants: number;
  activeTenants: number;
  monthlyRevenue: number;
  occupancyRate: number;
  totalTransactions: number;
  totalRentRecords: number;
  recentActivities: Activity[];
}

interface Activity {
  id: string;
  type: 'property' | 'vendor' | 'document' | 'payment' | 'transaction' | 'maintenance';
  title: string;
  description: string;
  time: string;
  isNew: boolean;
  propertyId?: string;
  vendorId?: string;
  transactionId?: string;
  userId?: string;
}

interface DashboardState {
  stats: DashboardStats | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  activities: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await get('/dashboard/stats');
      if (response.error) {
        return rejectWithValue(response.error.message);
      }
      // Handle the response data structure from your backend
      return response.data as DashboardStats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  'dashboard/fetchActivities',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await get(`/dashboard/activities?limit=${limit}`);
      if (response.error) {
        return rejectWithValue(response.error.message);
      }
      // Handle the response data structure from your backend
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch activities');
    }
  }
);

export const markAllActivitiesRead = createAsyncThunk(
  'dashboard/markAllActivitiesRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await post('/dashboard/activities/mark-all-read', {});
      if (response.error) {
        return rejectWithValue(response.error.message);
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark activities as read');
    }
  }
);

// Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
      // Keep only the last 50 activities
      if (state.activities.length > 50) {
        state.activities = state.activities.slice(0, 50);
      }
    },
    updateStats: (state, action: PayloadAction<Partial<DashboardStats>>) => {
      if (state.stats) {
        state.stats = { ...state.stats, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch recent activities
      .addCase(fetchRecentActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure activities is always an array
        state.activities = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Mark all activities as read
      .addCase(markAllActivitiesRead.fulfilled, (state) => {
        state.activities = state.activities.map((activity) => ({ ...activity, isNew: false }));
      });
  },
});

export const { clearError, addActivity, updateStats } = dashboardSlice.actions;
export default dashboardSlice.reducer;
