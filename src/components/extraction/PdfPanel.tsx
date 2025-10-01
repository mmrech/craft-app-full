import { useRef, useState } from "react";
import { useExtraction } from "@/contexts/ExtractionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Upload, Library } from "lucide-react";
import { toast } from "sonner";
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from "@/integrations/supabase/client";
import DocumentLibrary from "./DocumentLibrary";

// Configure PDF.js worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfPanel = () => {
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    scale,
    setScale,
    activeField,
    saveExtraction,
    activeFieldElement,
    updateFormData,
    currentDocumentName,
    setCurrentDocumentName,
    setCurrentDocumentId
  } = useExtraction();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  const loadPDF = async (file: File) => {
    setIsLoading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf_documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pdf_documents')
        .getPublicUrl(fileName);

      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          storage_path: fileName,
          file_size: file.size,
        })
        .select()
        .single();

      if (docError) throw docError;

      setCurrentDocumentId(docData.id);
      setCurrentDocumentName(file.name);
      setPdfFile(publicUrl);
      toast.success('PDF uploaded successfully');
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLibrary = async (doc: any) => {
    setIsLoading(true);
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('pdf_documents')
        .getPublicUrl(doc.storage_path);

      setCurrentDocumentId(doc.id);
      setCurrentDocumentName(doc.name);
      setPdfFile(publicUrl);
      toast.success('PDF loaded from library');
    } catch (error) {
      console.error('Error loading PDF from library:', error);
      toast.error('Failed to load PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setTotalPages(numPages);
    setCurrentPage(1);
    setIsLoading(false);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadPDF(file);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomChange = (value: string) => {
    setScale(parseFloat(value));
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;
    
    if (!activeField || !activeFieldElement) {
      toast.error('Please select a field first');
      return;
    }

    const selectedText = selection.toString().trim();

    // Update form field
    updateFormData(activeField, selectedText);
    if (activeFieldElement) {
      activeFieldElement.value = selectedText;
      activeFieldElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Add extraction trace and save to database
    await saveExtraction({
      fieldName: activeField,
      text: selectedText,
      page: currentPage,
      coordinates: { x: 0, y: 0, width: 0, height: 0 },
      method: 'manual',
      documentName: currentDocumentName
    });

    toast.success(`Extracted to ${activeField}`);
    selection.removeAllRanges();
  };

  return (
    <div className="w-[45%] bg-muted/50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-slate-800 text-white p-2 flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload PDF
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              <Library className="w-4 h-4 mr-2" />
              Library
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>PDF Library</DialogTitle>
            </DialogHeader>
            <DocumentLibrary onLoadDocument={loadFromLibrary} />
          </DialogContent>
        </Dialog>

        <Button
          size="sm"
          variant="secondary"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm">
          Page
          <Input
            type="number"
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
            min={1}
            max={totalPages}
            className="w-16 mx-2 h-8 text-center"
          />
          of {totalPages}
        </span>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Select value={scale.toString()} onValueChange={handleZoomChange}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.75">75%</SelectItem>
            <SelectItem value="1">100%</SelectItem>
            <SelectItem value="1.25">125%</SelectItem>
            <SelectItem value="1.5">150%</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto bg-primary px-3 py-1 rounded text-sm">
          {activeField ? `Extracting: ${activeField}` : 'No field selected'}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-slate-700 p-4">
        {!pdfFile ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center bg-background p-12 rounded-lg border-2 border-dashed">
              <h3 className="text-lg font-semibold mb-2">📄 Drop PDF file here or click to browse</h3>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                Select PDF File
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" onMouseUp={handleTextSelection}>
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="text-white p-4">Loading PDF...</div>}
              error={<div className="text-red-400 p-4">Failed to load PDF</div>}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-2xl"
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPanel;
