import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { PDFDocument } from 'pdf-lib';
import { FileIcon, Download, Merge, FileUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const DragDropArea = ({ onFileChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileChange({ target: { files: [files[0]] } });
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center h-full border-4 border-dashed rounded-lg p-8 transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <FileIcon className="w-12 h-12 text-muted-foreground mb-3" />
      <p className="text-lg font-semibold mb-2">Drag & Drop PDF here</p>
      <p className="text-sm text-muted-foreground mb-3">or</p>
      <label htmlFor="mini-pdf-upload" className="cursor-pointer">
        <Button variant="default">Choose PDF</Button>
      </label>
      <input
        id="mini-pdf-upload"
        type="file"
        onChange={onFileChange}
        accept="application/pdf"
        className="hidden"
      />
    </div>
  );
};

const MiniPDFViewer = ({ className = "" }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageOrder, setPageOrder] = useState([]);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState('');
  const mainContentRef = useRef(null);

  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(URL.createObjectURL(file));
      setPdfName(file.name);
      setCurrentPage(1);
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageOrder(Array.from({ length: numPages }, (_, i) => i + 1));
  };

  const onSave = async (saveAs = false) => {
    if (pdfFile) {
      try {
        const existingPdfBytes = await fetch(pdfFile).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const newPdfDoc = await PDFDocument.create();

        for (const pageNumber of pageOrder) {
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
          newPdfDoc.addPage(copiedPage);
        }

        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        if (saveAs) {
          setIsSaveAsModalOpen(true);
          setSaveAsFileName(pdfName || 'document.pdf');
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = pdfName || 'document.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('Error saving PDF:', error);
        alert('An error occurred while saving the PDF. Please try again.');
      }
    }
  };

  const handleSaveAs = async () => {
    if (saveAsFileName.trim()) {
      try {
        const existingPdfBytes = await fetch(pdfFile).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const newPdfDoc = await PDFDocument.create();

        for (const pageNumber of pageOrder) {
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
          newPdfDoc.addPage(copiedPage);
        }

        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = saveAsFileName.trim();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsSaveAsModalOpen(false);
      } catch (error) {
        console.error('Error saving PDF:', error);
        alert('An error occurred while saving the PDF. Please try again.');
      }
    }
  };

  const onMerge = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      try {
        const mergeFileBytes = await file.arrayBuffer();
        const existingPdfBytes = await fetch(pdfFile).then(res => res.arrayBuffer());
        
        const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
        const mergePdfDoc = await PDFDocument.load(mergeFileBytes);
        
        const copiedPages = await existingPdfDoc.copyPages(mergePdfDoc, mergePdfDoc.getPageIndices());
        copiedPages.forEach((page) => existingPdfDoc.addPage(page));
        
        const mergedPdfBytes = await existingPdfDoc.save();
        const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob);
        
        setPdfFile(mergedPdfUrl);
        setNumPages(existingPdfDoc.getPageCount());
        setPageOrder(Array.from({ length: existingPdfDoc.getPageCount() }, (_, i) => i + 1));
      } catch (error) {
        console.error('Error merging PDF:', error);
        alert('An error occurred while merging the PDF. Please try again.');
      }
    } else {
      alert("Please select a valid PDF file to merge.");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        const { scrollTop, clientHeight } = mainContentRef.current;
        const pageElements = document.querySelectorAll('[id^="mini-page_"]');
        for (let i = 0; i < pageElements.length; i++) {
          const element = pageElements[i] as HTMLElement;
          const elementTop = element.offsetTop;
          const elementBottom = elementTop + element.clientHeight;
          if (scrollTop >= elementTop - clientHeight / 2 && scrollTop < elementBottom - clientHeight / 2) {
            setCurrentPage(i + 1);
            break;
          }
        }
      }
    };

    const contentElement = mainContentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [pageOrder]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Compact Toolbar */}
      <div className="bg-background border-b p-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="file"
            onChange={onFileChange}
            accept="application/pdf"
            className="hidden"
            id="mini-pdf-file-input"
          />
          <label htmlFor="mini-pdf-file-input">
            <Button variant="outline" size="sm" asChild>
              <span>
                <FileUp className="h-4 w-4 mr-1" />
                {pdfName ? 'Change' : 'Upload'}
              </span>
            </Button>
          </label>
          {pdfName && (
            <span className="text-sm font-medium truncate">{pdfName}</span>
          )}
        </div>
        
        {pdfName && numPages > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentPage} / {numPages}
            </span>
            
            <input
              type="file"
              onChange={onMerge}
              accept="application/pdf"
              className="hidden"
              id="mini-pdf-merge-input"
            />
            <label htmlFor="mini-pdf-merge-input">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Merge className="h-4 w-4" />
                </span>
              </Button>
            </label>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuItem onClick={() => onSave(false)}>Save</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSave(true)}>Save As</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        {pdfFile ? (
          <div className="h-full border rounded-lg overflow-hidden bg-muted/20">
            <div ref={mainContentRef} className="overflow-y-auto h-full">
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                className="flex flex-col items-center p-4"
              >
                {pageOrder.map((pageNumber) => (
                  <div id={`mini-page_${pageNumber}`} key={`mini-page_${pageNumber}`} className="mb-4">
                    <Page
                      pageNumber={pageNumber}
                      width={Math.min(600, window.innerWidth - 100)}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                ))}
              </Document>
            </div>
          </div>
        ) : (
          <DragDropArea onFileChange={onFileChange} />
        )}
      </div>

      {/* Save As Dialog */}
      <Dialog open={isSaveAsModalOpen} onOpenChange={setIsSaveAsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save As</DialogTitle>
          </DialogHeader>
          <Input
            value={saveAsFileName}
            onChange={(e) => setSaveAsFileName(e.target.value)}
            placeholder="Enter file name"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && saveAsFileName.trim()) {
                handleSaveAs();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveAsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAs}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MiniPDFViewer;
