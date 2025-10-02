import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { documentUploadSchema } from "@/lib/validationSchemas";

const UploadSection = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setValidationError("");
    
    const result = documentUploadSchema.safeParse({ file });
    
    if (!result.success) {
      const error = result.error.errors[0]?.message || "Invalid file";
      setValidationError(error);
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!isOnline) {
      toast({
        title: "No internet connection",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    // Simulate upload and extraction process
    setTimeout(() => {
      setUploading(false);
      setUploadComplete(true);
      
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been processed and data extracted successfully.`,
      });

      setTimeout(() => {
        setUploadComplete(false);
        setSelectedFile(null);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-primary/10 rounded-full">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Upload Clinical Document</h2>
            <p className="text-muted-foreground">
              Upload patient records, lab results, or medical forms for AI-powered data extraction
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab-results">Lab Results</SelectItem>
                  <SelectItem value="medical-history">Medical History</SelectItem>
                  <SelectItem value="prescription">Prescription Form</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic Report</SelectItem>
                  <SelectItem value="insurance">Insurance Claim</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient ID (Optional)</Label>
              <Input id="patient-id" placeholder="Enter patient ID" />
            </div>

            <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer ${
              validationError ? 'border-destructive' : 'border-border'
            }`}>
              <Input
                type="file"
                className="hidden"
                id="file-upload"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-2">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF files only (MAX. 50MB)
                </p>
              </Label>
            </div>
            
            {validationError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || uploadComplete || !selectedFile || !isOnline}
            className="w-full"
            size="lg"
          >
            {uploading && "Processing Document..."}
            {uploadComplete && (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Extraction Complete!
              </>
            )}
            {!uploading && !uploadComplete && (
              <>
                <Upload className="w-5 h-5 mr-2" />
                {!isOnline ? 'Offline - Cannot Upload' : 'Upload and Extract Data'}
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-secondary/30 border-secondary">
        <h3 className="font-semibold text-foreground mb-3">AI Extraction Features</h3>
        <ul className="space-y-2 text-sm text-secondary-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            Automatic field recognition and data extraction
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            Patient information, diagnoses, and treatment plans
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            Lab results, medications, and vital signs
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            HIPAA-compliant secure storage
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default UploadSection;
