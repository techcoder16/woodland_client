// src/components/ManageProperty.tsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";

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
import axios from "axios";
import { getAccessToken } from "@/helper/tokenManager";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fetchProperties } from "@/redux/dataStore/propertySlice";



const MainTransaction = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const property: any = location.state?.property;
  
  // Redux selectors
  const { properties } = useAppSelector((state) => state.properties);
  
  // Property selection state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(property?.id || '');
  
  // OCR Results state
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [showOcrResults, setShowOcrResults] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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

    if (!currentState.file || !selectedPropertyId) {
      setState(prev => ({
        ...prev,
        error: 'Please select a file and property'
      }));
      return;
    }

    setState(prev => ({ ...prev, uploading: true, error: null }));

    try {
      // Check if it's a PDF file for transaction extraction
      if (currentState.file.type === 'application/pdf') {
        // Use PDF extraction API
        const formData = new FormData();
        formData.append('file', currentState.file);
        formData.append('propertyId', selectedPropertyId);

        // Get access token
        const token = await getAccessToken();
        const API_URL = import.meta.env.VITE_API_URL;

        // Create axios instance with 5-minute timeout
        const axiosInstance = axios.create({
          baseURL: API_URL,
          timeout: 300000, // 5 minutes
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        const response = await axiosInstance.post('transaction/extract', formData);
        
        console.log('OCR API Response:', response.data);
        
        if (response.data) {
          setState(prev => ({
            ...prev,
            uploading: false,
            uploaded: true,
            error: null
          }));
          
          // Store OCR results and show them
          setOcrResults(response.data);
          setUploadedFile(currentState.file);
          setShowOcrResults(true);
          toast.success('PDF processed and transaction extracted successfully!');
        }
      } else {
        // Regular document upload
        const formData = new FormData();
        formData.append('file', currentState.file);
        formData.append('propertyId', selectedPropertyId);
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
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  // Helper function to parse OCR content
  const parseOcrContent = (ocrContent: string) => {
    try {
      // Extract JSON from the OCR content
      const jsonMatch = ocrContent.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Error parsing OCR content:', error);
      return null;
    }
  };

  // Load properties for selection
  React.useEffect(() => {
    dispatch(fetchProperties({ page: 1, search: '' }));
  }, [dispatch]);

  return (
    <DashboardLayout>
      <div className="p-6 w-full mx-auto min-h-screen ">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">
                Document Management
              </h1>
              {property && (
                <p className="text-sm text-muted-foreground">
                  Property: {property.propertyNumber == 0 ? "0" : property.propertyNumber} - {property.propertyName}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Property Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Select Property
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose the property for document upload and PDF transaction extraction
              </p>
            </div>
            
            <div className="max-w-md">
              <Label htmlFor="property-select">Property</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties
                    .filter((property) => property.propertyStatus !== 'DRAFT')
                    .map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.propertyNo || property.id} - {property.propertyName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* OCR Results Display */}
        {showOcrResults && ocrResults && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  OCR Extraction Results
                </h2>
                <p className="text-sm text-muted-foreground">
                  Transaction data extracted from PDF document
                </p>
                {uploadedFile && (
                  <p className="text-sm text-primary mt-1">
                    📄 File: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOcrResults(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            
            
            <div className="space-y-6">
              {/* Transaction Data */}
              {ocrResults.transaction?.transaction && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">✅ Created Transaction:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(ocrResults.transaction.transaction).map(([key, value]) => {
                      if (key === 'property' || key === 'id' || key === 'createdAt' || key === 'updatedAt') return null;
                      return (
                        <div key={key} className="bg-white p-3 rounded border">
                          <span className="font-medium text-muted-foreground text-sm block mb-1">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-foreground">
                            {value !== null && value !== undefined ? String(value) : 'N/A'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Parsed OCR Data */}
              {ocrResults.ocrData?.ocr_content && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">📋 Parsed Invoice Data:</h3>
                  {(() => {
                    const parsedData = parseOcrContent(ocrResults.ocrData.ocr_content);
                    return parsedData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(parsedData).map(([key, value]) => (
                          <div key={key} className="bg-white p-3 rounded border">
                            <span className="font-medium text-muted-foreground text-sm block mb-1">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span className="text-foreground">
                              {value !== null && value !== undefined ? String(value) : 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ Could not parse OCR content. Raw data shown below.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Raw OCR Content */}
              <div className=" rounded-lg p-4">
                <h3 className="font-semibold text-muted-foreground mb-3">🔍 Raw OCR Content:</h3>
                <pre className="text-sm text-foreground bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                  {ocrResults.ocrData?.ocr_content || 'No OCR content available'}
                </pre>
              </div>

              {/* Full API Response */}
              <div className=" rounded-lg p-4">
                <h3 className="font-semibold text-muted-foreground mb-3">📊 Full API Response:</h3>
                <pre className="text-sm text-foreground bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(ocrResults, null, 2)}
                </pre>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 text-sm">
                  ✅ Transaction has been saved as a draft and is ready for review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Upload Cards */}
        <div className="grid gap-6">
          <DocumentUploadCard
            title="Upload Documents"
            description="Upload contracts, reports, PDFs for transaction extraction, or any other property documents"
            icon={FolderOpen}
            type="other"
            uploadState={otherDocsUpload}
            onFileSelect={(e) => handleFileSelect(e, 'other')}
            onUpload={() => handleUpload('other')}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-accent border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-accent-foreground mb-2">Upload Guidelines</h3>
          <ul className="text-sm text-accent-foreground/90 space-y-1">
            <li>• <strong>PDF Files:</strong> Automatically processed for transaction extraction using OCR (up to 5 minutes processing time)</li>
            <li>• <strong>Other Documents:</strong> Supported formats: DOC, DOCX, JPG, JPEG, PNG</li>
            <li>• Maximum file size: 10MB per document</li>
            <li>• PDF files will create draft transactions automatically when uploaded</li>
            <li>• Other documents will be processed and added to property records</li>
            <li>• Ensure all sensitive information is properly handled according to privacy policies</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MainTransaction;