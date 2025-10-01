import { useRef, useEffect, useState } from "react";
import { useExtraction } from "@/contexts/ExtractionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Upload, Library } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";
import DocumentLibrary from "./DocumentLibrary";

// Configure PDF.js worker - using unpkg CDN which has proper CORS
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfPanel = () => {
  const {
    pdfDoc,
    setPdfDoc,
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
    extractions
  } = useExtraction();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageText, setCurrentPageText] = useState<any>(null);

  const loadPDF = async (file: File) => {
    setIsLoading(true);
    try {
      // Upload to Supabase Storage (no auth required with public policies)
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdf_documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload PDF');
        setIsLoading(false);
        return;
      }

      // Load PDF for display
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      // Save document metadata to database
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          storage_path: fileName,
          file_size: file.size,
          total_pages: pdf.numPages
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error('Failed to save document metadata');
      } else {
        setCurrentDocumentId(docData.id);
      }

      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setCurrentDocumentName(file.name);
      toast.success('PDF uploaded and loaded successfully');
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
      // Download from storage
      const { data, error } = await supabase.storage
        .from('pdf_documents')
        .download(doc.storage_path);

      if (error) throw error;

      // Load PDF
      const arrayBuffer = await data.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setCurrentDocumentName(doc.name);
      setCurrentDocumentId(doc.id);
      
      toast.success(`Loaded: ${doc.name}`);
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Render canvas
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Render text layer for selection
    const textContent = await page.getTextContent();
    setCurrentPageText(textContent);
    
    const textLayer = textLayerRef.current;
    textLayer.innerHTML = '';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    // Create properly positioned text spans
    textContent.items.forEach((item: any) => {
      if (!item.str) return;
      
      const tx = item.transform;
      const style = textContent.styles?.[item.fontName] || {};
      
      const span = document.createElement('span');
      span.textContent = item.str;
      span.style.position = 'absolute';
      span.style.left = `${tx[4]}px`;
      span.style.bottom = `${viewport.height - tx[5]}px`;
      span.style.fontSize = `${tx[3]}px`;
      span.style.fontFamily = item.fontName || 'sans-serif';
      span.style.transform = `scaleX(${tx[0] / tx[3]})`;
      span.style.transformOrigin = '0% 0%';
      span.style.whiteSpace = 'pre';
      
      textLayer.appendChild(span);
    });
  };

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale]);

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
    if (!activeField || !activeFieldElement) {
      toast.error('Please select a field first');
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;

    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      const coordinates = {
        x: (rect.left - containerRect.left) / scale,
        y: (rect.top - containerRect.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale
      };

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
    }
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

      {/* PDF Container */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-slate-700 p-8">
        {!pdfDoc ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center bg-background p-12 rounded-lg border-2 border-dashed">
              <h3 className="text-lg font-semibold mb-2">📄 Drop PDF file here or click to browse</h3>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                Select PDF File
              </Button>
            </div>
          </div>
        ) : (
          <div className="inline-block mx-auto bg-white shadow-lg relative" onMouseUp={handleTextSelection}>
            <canvas ref={canvasRef} className="max-w-full" />
            <div 
              ref={textLayerRef} 
              className="absolute top-0 left-0 textLayer"
              style={{ 
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                opacity: 0.3,
                lineHeight: 1,
                pointerEvents: 'auto',
                userSelect: 'text',
                cursor: 'text'
              }}
            />
            {/* Render extraction highlights */}
            {extractions
              .filter(ext => ext.page === currentPage)
              .map(ext => (
                <div
                  key={ext.id}
                  className="absolute border-2 border-primary/50 bg-primary/10 pointer-events-none"
                  style={{
                    left: `${ext.coordinates.x * scale}px`,
                    top: `${ext.coordinates.y * scale}px`,
                    width: `${ext.coordinates.width * scale}px`,
                    height: `${ext.coordinates.height * scale}px`,
                  }}
                  title={`${ext.fieldName}: ${ext.text}`}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPanel;
