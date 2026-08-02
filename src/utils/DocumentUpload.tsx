
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";



export interface UploadState {
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
}


  export const DocumentUploadCard = ({ 
    title, 
    description, 
    icon: Icon, 
    type, 
    uploadState, 
    onFileSelect, 
    onUpload 
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    type: 'letter' | 'invoice' | 'other';
    uploadState: UploadState;
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onUpload: () => void;
  }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="border-b bg-accent">
        <CardTitle className="text-xl font-semibold flex items-center text-card-foreground">
          <Icon className="h-6 w-6 mr-3 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor={`${type}-upload`} className="text-sm font-medium text-muted-foreground">
              Select File
            </Label>
            <Input
              id={`${type}-upload`}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={onFileSelect}
              className="mt-2"
              disabled={uploadState.uploading}
            />
          </div>

          {uploadState.file && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Selected:</strong> {uploadState.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Size: {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {uploadState.error && (
            <div className="flex items-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mr-2" />
              <p className="text-sm text-destructive">{uploadState.error}</p>
            </div>
          )}

          {uploadState.uploaded && (
            <div className="flex items-center p-3 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success mr-2" />
              <p className="text-sm text-success">Document uploaded successfully!</p>
            </div>
          )}

          <Button
            onClick={onUpload}
            disabled={!uploadState.file || uploadState.uploading || uploadState.uploaded}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted"
          >
            {uploadState.uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : uploadState.uploaded ? (
              'Uploaded'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
