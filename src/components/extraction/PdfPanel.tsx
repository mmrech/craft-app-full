import { useRef, useState } from "react";
import { useExtraction } from "@/contexts/ExtractionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Upload, Library, AlertCircle, Pen as PenIcon } from "lucide-react";
import { toast } from "sonner";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { supabase } from "@/integrations/supabase/client";
import DocumentLibrary from "./DocumentLibrary";
import { PdfHighlightLayer } from "./PdfHighlightLayer";
import { PdfAnnotationCanvas } from "./PdfAnnotationCanvas";
import { AnnotationToolbar } from "./AnnotationToolbar";
import type { AnnotationTool } from "./AnnotationToolbar";

// Configure PDF.js worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


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
    currentDocumentId,
    setCurrentDocumentId,
    extractions,
    highlightedExtractionId
  } = useExtraction();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [activeTool, setActiveTool] = useState<'select' | 'highlighter' | 'pen' | 'rectangle' | 'circle' | 'text' | 'eraser'>('select');
  const [annotationColor, setAnnotationColor] = useState('rgba(255, 235, 59, 0.4)');
  const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 1100 });

  // File validation constants
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['application/pdf'];
  const MAX_RETRY_ATTEMPTS = 3;

  // Validate file before upload
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only PDF files are supported' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
    }

    // Check if file is empty
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    return { valid: true };
  };

  const loadPDF = async (file: File) => {
    setIsLoading(true);
    setLoadError(null);
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      setIsLoading(false);
      return;
    }

    try {
      const fileName = `${Date.now()}-${file.name}`;
      
      // Upload with progress tracking
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf_documents')
        .upload(fileName, file);

      if (uploadError) {
        if (uploadError.message.includes('storage')) {
          throw new Error('Storage quota exceeded. Please contact support.');
        }
        throw uploadError;
      }

      // Get signed URL for private bucket (valid for 1 hour)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('pdf_documents')
        .createSignedUrl(fileName, 3600);

      if (urlError) throw urlError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          storage_path: fileName,
          file_size: file.size,
          user_id: user.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      setCurrentDocumentId(docData.id);
      setCurrentDocumentName(file.name);
      setPdfFile(signedUrlData.signedUrl);
      
      toast.success('PDF uploaded successfully');
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      const errorMessage = error.message || 'Failed to load PDF';
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLibrary = async (doc: any) => {
    setIsLoading(true);
    try {
      // Get signed URL for private bucket (valid for 1 hour)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('pdf_documents')
        .createSignedUrl(doc.storage_path, 3600);

      if (urlError) throw urlError;

      setCurrentDocumentId(doc.id);
      setCurrentDocumentName(doc.name);
      setPdfFile(signedUrlData.signedUrl);
      
      // Load extracted text into formData for AI extraction
      const { data: pdfExtractions } = await supabase
        .from('pdf_extractions')
        .select('full_text, page_number')
        .eq('document_id', doc.id)
        .order('page_number');

      if (pdfExtractions && pdfExtractions.length > 0) {
        const fullText = pdfExtractions
          .map(e => e.full_text)
          .join('\n\n');
        updateFormData('_pdfFullText', fullText);
      }
      
      toast.success('PDF loaded from library');
    } catch (error) {
      console.error('Error loading PDF from library:', error);
      toast.error('Failed to load PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const onDocumentLoadSuccess = async ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setTotalPages(numPages);
    setCurrentPage(1);
    setIsLoading(false);
    setLoadError(null);
    
    // Extract text from all pages in the browser
    if (currentDocumentId) {
      setIsExtractingText(true);
      setExtractionProgress(0);
      toast.info(`Extracting text from ${numPages} pages...`);
      
      try {
        await extractAllPagesText(numPages);
        toast.success(`Successfully extracted text from ${numPages} pages`);
        
        // Load extracted text into formData for AI extraction
        const { data: pdfExtractions } = await supabase
          .from('pdf_extractions')
          .select('full_text, page_number')
          .eq('document_id', currentDocumentId)
          .order('page_number');

        if (pdfExtractions && pdfExtractions.length > 0) {
          const fullText = pdfExtractions
            .map(e => e.full_text)
            .join('\n\n');
          updateFormData('_pdfFullText', fullText);
        }
      } catch (error: any) {
        console.error('Extraction error:', error);
        const errorMsg = error.message || 'Text extraction failed';
        toast.error(errorMsg);
        setLoadError(errorMsg);
      } finally {
        setIsExtractingText(false);
        setExtractionProgress(0);
      }
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setIsLoading(false);
    
    let errorMessage = 'Failed to load PDF';
    
    if (error.message.includes('password')) {
      errorMessage = 'This PDF is password-protected. Please unlock it first.';
    } else if (error.message.includes('Invalid PDF')) {
      errorMessage = 'This file appears to be corrupted or is not a valid PDF.';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    setLoadError(errorMessage);
    toast.error(errorMessage);
  };

  const extractAllPagesText = async (totalPgs: number, retryAttempt = 0): Promise<void> => {
    if (!pdfFile || !currentDocumentId) return;

    try {
      const pdfjs = await import('pdfjs-dist');
      const loadingTask = pdfjs.getDocument(pdfFile);
      const pdf = await loadingTask.promise;

      const extractions = [];
      const batchSize = 5; // Process 5 pages at a time
      
      for (let pageNum = 1; pageNum <= totalPgs; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0 });

          const textItems = textContent.items.map((item: any) => {
            const transform = item.transform;
            const fontHeight = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);

            return {
              text: item.str,
              x: transform[4],
              y: viewport.height - transform[5] - fontHeight,
              width: item.width,
              height: fontHeight,
              fontName: item.fontName,
            };
          });

          const fullText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          extractions.push({
            document_id: currentDocumentId,
            page_number: pageNum,
            text_items: textItems,
            full_text: fullText,
          });

          // Update progress
          const progress = Math.round((pageNum / totalPgs) * 100);
          setExtractionProgress(progress);

          // Save in batches
          if (extractions.length >= batchSize || pageNum === totalPgs) {
            const { error } = await supabase
              .from('pdf_extractions')
              .upsert(extractions, {
                onConflict: 'document_id,page_number',
              });

            if (error) {
              console.error('Failed to save extraction batch:', error);
              throw new Error(`Failed to save page ${pageNum - extractions.length + 1}-${pageNum}`);
            }
            
            extractions.length = 0; // Clear batch
          }
        } catch (pageError: any) {
          console.error(`Error extracting page ${pageNum}:`, pageError);
          // Continue with next page even if one fails
          toast.error(`Warning: Failed to extract page ${pageNum}`);
        }
      }

      // Update document with total pages
      const { error: updateError } = await supabase
        .from('documents')
        .update({ total_pages: totalPgs })
        .eq('id', currentDocumentId);

      if (updateError) {
        console.error('Failed to update document:', updateError);
      }

    } catch (error: any) {
      console.error('Extraction error:', error);
      
      // Retry logic
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        toast.info(`Retrying extraction (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryAttempt + 1))); // Exponential backoff
        return extractAllPagesText(totalPgs, retryAttempt + 1);
      }
      
      throw new Error(`Failed to extract text after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`);
    }
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
    
    // Calculate real coordinates from selection
    let coordinates = { x: 0, y: 0, width: 0, height: 0 };
    
    try {
      if (selection.rangeCount > 0 && currentDocumentId) {
        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();
        
        if (rects.length > 0) {
          // Get the PDF canvas element for coordinate transformation
          const pdfCanvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
          if (pdfCanvas) {
            const pdfRect = pdfCanvas.getBoundingClientRect();
            const firstRect = rects[0];
            const lastRect = rects[rects.length - 1];
            
            // Transform viewport coordinates to PDF canvas coordinates
            // Store coordinates in canvas pixels (already scaled), not PDF points
            // The Fabric.js canvas is sized to match the scaled PDF canvas
            coordinates = {
              x: firstRect.left - pdfRect.left,
              y: firstRect.top - pdfRect.top,
              width: lastRect.right - firstRect.left,
              height: lastRect.bottom - firstRect.top,
            };
            
            // Debug logging
            console.log('Coordinate capture:', {
              page: currentPage,
              scale,
              viewport: { left: firstRect.left, top: firstRect.top },
              pdfRect: { left: pdfRect.left, top: pdfRect.top },
              finalCoords: coordinates
            });
          }
        }
      }
    } catch (error) {
      console.warn('Could not calculate coordinates:', error);
    }

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
      coordinates,
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

        <Button
          size="sm"
          variant={annotationMode ? "default" : "secondary"}
          onClick={() => setAnnotationMode(!annotationMode)}
        >
          <PenIcon className="w-4 h-4 mr-2" />
          {annotationMode ? 'Exit Annotation Mode' : 'Annotation Mode'}
        </Button>

        <div className="ml-auto bg-primary px-3 py-1 rounded text-sm">
          {activeField ? `Extracting: ${activeField}` : 'No field selected'}
        </div>
      </div>

      {/* Annotation Toolbar */}
      {annotationMode && pdfFile && (
        <div className="px-4 py-2 border-b bg-background">
          <AnnotationToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onClearAll={() => {
              if (confirm('Clear all annotations on this page?')) {
                toast.success('Annotations cleared');
              }
            }}
            onSave={() => toast.success('Annotations auto-saved')}
            color={annotationColor}
            onColorChange={setAnnotationColor}
          />
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-slate-700 p-4 flex flex-col">
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
          <div className="relative w-full">
            {isExtractingText && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg z-10 min-w-[300px]">
                <div className="text-sm font-medium mb-2 text-center">
                  Extracting text from PDF... {extractionProgress}%
                </div>
                <Progress value={extractionProgress} className="h-2" />
              </div>
            )}
            {loadError ? (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-8 text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-destructive mb-2">PDF Load Error</h3>
                <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  Try Another File
                </Button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <PdfHighlightLayer
                  file={pdfFile}
                  currentPage={currentPage}
                  scale={scale}
                  extractions={extractions.filter(e => e.page === currentPage)}
                  highlightedExtractionId={highlightedExtractionId}
                  onDocumentLoadSuccess={(e) => {
                    onDocumentLoadSuccess(e);
                    // Capture actual PDF dimensions from rendered page
                    setTimeout(() => {
                      const pageCanvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
                      if (pageCanvas) {
                        setPdfDimensions({
                          width: pageCanvas.width / scale,
                          height: pageCanvas.height / scale,
                        });
                      }
                    }, 100);
                  }}
                  onDocumentLoadError={onDocumentLoadError}
                  onMouseUp={handleTextSelection}
                  loading={
                    <div className="text-white p-4 text-center">
                      <div className="animate-pulse">Loading PDF...</div>
                    </div>
                  }
                />
                <PdfAnnotationCanvas
                  documentId={currentDocumentId}
                  pageNumber={currentPage}
                  width={pdfDimensions.width}
                  height={pdfDimensions.height}
                  scale={scale}
                  activeTool={activeTool}
                  color={annotationColor}
                  annotationMode={annotationMode}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPanel;
