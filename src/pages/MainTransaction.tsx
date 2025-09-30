// src/components/ManageProperty.tsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";

import DashboardLayout from "@/components/layout/DashboardLayout";
// import { uploadDocument } from "@/store/slices/documentSlice";

// Icons
import { 
  Building2, 
  Upload,
  FileText,
  Receipt,
  FolderOpen,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { DocumentUploadCard, UploadState } from "@/utils/DocumentUpload";
import { uploadDocument } from "@/redux/dataStore/documentSlice";



const MainTransaction = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const property: any = location.state?.property;

  // Upload states for each document type
  const [letterUpload, setLetterUpload] = useState<UploadState>({
    file: null,
    uploading: false,
    uploaded: false,
    error: null
  });

  const [invoiceUpload, setInvoiceUpload] = useState<UploadState>({
    file: null,
    uploading: false,
    uploaded: false,
    error: null
  });

  const [otherDocsUpload, setOtherDocsUpload] = useState<UploadState>({
    file: null,
    uploading: false,
    uploaded: false,
    error: null
  });

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'letter' | 'invoice' | 'other'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const updateState = (setter: React.Dispatch<React.SetStateAction<UploadState>>) => {
      setter(prev => ({
        ...prev,
        file,
        uploaded: false,
        error: null
      }));
    };

    switch (type) {
      case 'letter':
        updateState(setLetterUpload);
        break;
      case 'invoice':
        updateState(setInvoiceUpload);
        break;
      case 'other':
        updateState(setOtherDocsUpload);
        break;
    }
  };

  const handleUpload = async (type: 'letter' | 'invoice' | 'other') => {
    let currentState: UploadState;
    let setState: React.Dispatch<React.SetStateAction<UploadState>>;

    switch (type) {
      case 'letter':
        currentState = letterUpload;
        setState = setLetterUpload;
        break;
      case 'invoice':
        currentState = invoiceUpload;
        setState = setInvoiceUpload;
        break;
      case 'other':
        currentState = otherDocsUpload;
        setState = setOtherDocsUpload;
        break;
    }

    if (!currentState.file || !property?.id) {
      setState(prev => ({
        ...prev,
        error: 'Please select a file and ensure property is loaded'
      }));
      return;
    }

    setState(prev => ({ ...prev, uploading: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('file', currentState.file);
      formData.append('propertyId', property.id);
      formData.append('documentType', type);

      // Dispatch Redux action
      const result = await dispatch(uploadDocument(formData) as any);
      
      if (result.type.endsWith('/fulfilled')) {
        setState(prev => ({
          ...prev,
          uploading: false,
          uploaded: true,
          error: null
        }));
      } else {
        throw new Error(result.payload || 'Upload failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 w-full mx-auto min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Document Management
              </h1>
              {property && (
                <p className="text-gray-600">
                  Property: {property.propertyNumber || property.id}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Document Upload Cards */}
        <div className="grid gap-6">
        

        
          <DocumentUploadCard
            title="Upload Documents"
            description="Upload contracts, reports, or any other property documents"
            icon={FolderOpen}
            type="other"
            uploadState={otherDocsUpload}
            onFileSelect={(e) => handleFileSelect(e, 'other')}
            onUpload={() => handleUpload('other')}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Upload Guidelines</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG</li>
            <li>• Maximum file size: 10MB per document</li>
            <li>• Documents will be automatically processed and added to transaction records</li>
            <li>• Ensure all sensitive information is properly handled according to privacy policies</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MainTransaction;