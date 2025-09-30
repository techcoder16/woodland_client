// src/store/slices/documentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
interface Document {
  id: string;
  propertyId: string;
  documentType: 'letter' | 'invoice' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  transactionId?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface DocumentState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
}

interface UploadDocumentRequest {
  file: File;
  propertyId: string;
  documentType: 'letter' | 'invoice' | 'other';
}

interface UploadDocumentResponse {
  document: Document;
  transactionId: string;
  message: string;
}

// Initial state
const initialState: DocumentState = {
  documents: [],
  loading: false,
  error: null,
  uploadProgress: 0,
};

// Async thunks
export const uploadDocument = createAsyncThunk<
  UploadDocumentResponse,
  FormData,
  { rejectValue: string }
>('documents/upload', async (formData, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary for FormData
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const getDocumentsByProperty = createAsyncThunk<
  Document[],
  string,
  { rejectValue: string }
>('documents/getByProperty', async (propertyId, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/documents/property/${propertyId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || 'Failed to fetch documents');
    }

    const data = await response.json();
    return data.documents;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const deleteDocument = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('documents/delete', async (documentId, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.message || 'Failed to delete document');
    }

    return documentId;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

// Document slice
const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload document
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents.unshift(action.payload.document);
        state.uploadProgress = 100;
        state.error = null;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Upload failed';
        state.uploadProgress = 0;
      })

      // Get documents by property
      .addCase(getDocumentsByProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDocumentsByProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
        state.error = null;
      })
      .addCase(getDocumentsByProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch documents';
      })

      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = state.documents.filter(doc => doc.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete document';
      });
  },
});

export const { clearError, setUploadProgress, resetUploadProgress } = documentSlice.actions;
export default documentSlice.reducer;

// Selectors
export const selectDocuments = (state: { documents: DocumentState }) => state.documents.documents;
export const selectDocumentLoading = (state: { documents: DocumentState }) => state.documents.loading;
export const selectDocumentError = (state: { documents: DocumentState }) => state.documents.error;
export const selectUploadProgress = (state: { documents: DocumentState }) => state.documents.uploadProgress;