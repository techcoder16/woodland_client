import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

import { DEFAULT_COOKIE_GETTER } from "../../helper/Cookie";
import getApi from "../../helper/getApi";

// Define the type for a team member
interface TeamMember {
  User: string;
  email: string;
  // Add other fields as needed
}

interface TeamState {
  teams: TeamMember[];
  loading: boolean;
  error: string | null;

}


interface GetApiResponse {
  data: TeamMember[];

}

// Define the async thunk to fetch team data
export const fetchTeams = createAsyncThunk<GetApiResponse>(
  "teams",
  async (payload, { rejectWithValue }) => {
    try {
      const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        "Authorization": `Bearer ${activationToken}`,
        "Accept": "*/*",
        "Access-Control-Allow-Origin": "*",
      };
      
      
      const response = await getApi('auth/get_team_data',"", headers);
      
      return response as GetApiResponse;
      
    } catch (error: any) {
      console.error(error);
      return rejectWithValue(error.message);
    }
  }
);

// Define the initial state
const initialState: TeamState = { 
  teams: [],
  
  loading: false,
  error: null,
};

// Create the slice
const teamSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    addTeamMember: (state, action: PayloadAction<TeamMember>) => {
      state.teams.push(action.payload);
    },
    clearTeams: (state) => {
      state.teams = [];
    
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
        state.error = null; // Reset error on new request
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string; // Cast payload to string
      })
      .addCase(fetchTeams.fulfilled, (state, action: PayloadAction<GetApiResponse>) => {
        state.loading = false;
     
        state.teams = action.payload.data;
        
      });
  },
});

// Export the actions and reducer
export const { addTeamMember, clearTeams } = teamSlice.actions;
export default teamSlice.reducer;
