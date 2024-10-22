import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { DEFAULT_COOKIE_GETTER } from "../../helper/Cookie";
import getApi from "../../helper/getApi";

// Define the type for user data
interface User {
  id: number;
  name: string;
  email: string;
  company: string;
  website: string;
  // Add other fields as needed
}

interface UserState {
  users: User[];  // Use an array of User objects or adjust as needed
  userCount: number;
  loading: boolean;
  error: string | null;
}

interface UserDataPayload {
  page: number;
  searchQuery: string;
  selectedFilters: { [key: string]: string };
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
}

interface GetApiResponse {
  users: User[];
  userCount: number;
}

// Define the async thunk
export const userData = createAsyncThunk<GetApiResponse, UserDataPayload>(
  "users",
  async (payload, { rejectWithValue }) => {
    try {
      const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        "Authorization": `Bearer ${activationToken}`,
        "Accept": "*/*",
        "Access-Control-Allow-Origin": "true",
      };


      const response = await getApi('auth/getUsers', JSON.stringify(payload), headers);
      return response as GetApiResponse;  // Cast response to GetApiResponse type
      
    } catch (error: any) {
      console.error(error);
      return rejectWithValue(error.message);
    }
  }
);

// Define the initial state
const initialState: UserState = {
  users: [],
  userCount: 0,
  loading: false,
  error: null,
};

// Create the slice
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(userData.pending, (state) => {
        state.loading = true;
        state.error = null; // Reset error on new request
      })
      .addCase(userData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string; // Cast payload to string
      })
      .addCase(userData.fulfilled, (state, action: PayloadAction<GetApiResponse>) => {
        state.loading = false;
        state.users = action.payload.users;
        state.userCount = action.payload.userCount;
      });
  },
});

// Export the actions and reducer
export const { addUser } = userSlice.actions;
export default userSlice.reducer;
