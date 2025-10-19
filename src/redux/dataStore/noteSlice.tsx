// src/redux/dataStore/noteSlice.tsx
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import { AppDispatch } from "../store";
import { post, patch, del } from "@/helper/api";

// Define Note interface
export interface Note {
  id?: string;
  propertyId: string;
  content: string;
  date: string;
  employee: string;
  detail?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define Note state type
interface NoteState {
  notes: Note[];
  totalPages: number;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: NoteState = {
  notes: [],
  totalPages: 1,
  loading: false,
  error: null,
};

// Fetch Notes data from API
export const fetchNotes = createAsyncThunk(
  "note/fetchNotes",
  async ({ propertyId, page, search }: { propertyId: string; page: number; search: string }, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const params = `?propertyId=${propertyId}&page=${page}&search=${search}`;
      const data = await getApi("property-management/note", params, headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch notes");
    }
  }
);

// Get Note by ID
export const fetchNoteById = createAsyncThunk(
  "note/fetchNoteById",
  async (id: string, { rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const data = await getApi(`property-management/note/${id}`, "", headers);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch note");
    }
  }
);

// Create Note
export const createNote = createAsyncThunk(
  "note/createNote",
  async (noteData: Omit<Note, 'id'>, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      const res = await post("property-management/note", noteData, headers);
      
      // Check for API errors
      if (res.error) {
        return rejectWithValue(res.error.message || "Failed to create note");
      }
      
      // Refresh the notes list
      await (dispatch as AppDispatch)(fetchNotes({
        propertyId: noteData.propertyId,
        page: 1,
        search: ""
      }));

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create note");
    }
  }
);

// Update Note
export const updateNote = createAsyncThunk(
  "note/updateNote",
  async ({ id, noteData }: { id: string; noteData: Partial<Note> }, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      const res = await post(`property-management/note/${id}`, noteData, headers);
      
      // Check for API errors
      if (res.error) {
        return rejectWithValue(res.error.message || "Failed to update note");
      }
      
      // Refresh the notes list
      if (noteData.propertyId) {
        await (dispatch as AppDispatch)(fetchNotes({
          propertyId: noteData.propertyId,
          page: 1,
          search: ""
        }));
      }

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update note");
    }
  }
);

// Delete Note
export const deleteNote = createAsyncThunk(
  "note/deleteNote",
  async ({ id, propertyId }: { id: string; propertyId: string }, { dispatch, rejectWithValue }) => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      };

      const res = await post(`property-management/note/${id}/delete`, {}, headers);
      
      // Check for API errors
      if (res.error) {
        return rejectWithValue(res.error.message || "Failed to delete note");
      }
      
      // Refresh the notes list
      await (dispatch as AppDispatch)(fetchNotes({
        propertyId,
        page: 1,
        search: ""
      }));

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete note");
    }
  }
);

// Create Note Slice
const noteSlice = createSlice({
  name: "note",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        state.notes = payload?.data?.notes || payload?.notes || [];
        state.totalPages = payload?.data?.totalPages || payload?.totalPages || 1;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch notes";
      })
      
      // Fetch note by ID
      .addCase(fetchNoteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNoteById.fulfilled, (state, action) => {
        state.loading = false;
        // Update the specific note in the array if it exists
        const payload = action.payload as any;
        const note = payload?.data?.note || payload?.note;
        if (note) {
          const index = state.notes.findIndex(n => n.id === note.id);
          if (index !== -1) {
            state.notes[index] = note;
          }
        }
      })
      .addCase(fetchNoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch note";
      })
      
      // Create note
      .addCase(createNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNote.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create note";
      })
      
      // Update note
      .addCase(updateNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNote.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update note";
      })
      
      // Delete note
      .addCase(deleteNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNote.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete note";
      });
  },
});

export const { clearError } = noteSlice.actions;
export default noteSlice.reducer;
