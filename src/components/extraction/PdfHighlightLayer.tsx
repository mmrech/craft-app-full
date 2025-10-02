import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Rect } from "fabric";
import { Document, Page } from "react-pdf";

interface Extraction {
  id: string;
  fieldName: string;
  coordinates: { x: number; y: number; width: number; height: number };
  method: 'manual' | 'markdown-search';
}

interface PdfHighlightLayerProps {
  file: string;
  currentPage: number;
  scale: number;
  extractions: Extraction[];
  highlightedExtractionId: string | null;
  onDocumentLoadSuccess: (data: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  onMouseUp: () => void;
  loading: React.ReactNode;
}

export const PdfHighlightLayer = ({
  file,
  currentPage,
  scale,
  extractions,
  highlightedExtractionId,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onMouseUp,
  loading,
}: PdfHighlightLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      selection: false,
      renderOnAddRemove: false,
    });

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Update canvas size to match PDF page
  useEffect(() => {
    if (!fabricCanvasRef.current || !pageRef.current) return;

    const updateCanvasSize = () => {
      const pageElement = pageRef.current?.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
      if (pageElement) {
        const width = pageElement.width;
        const height = pageElement.height;
        
        fabricCanvasRef.current?.setDimensions({ width, height });
        if (canvasRef.current) {
          canvasRef.current.style.position = 'absolute';
          canvasRef.current.style.top = '0';
          canvasRef.current.style.left = '0';
          canvasRef.current.style.pointerEvents = 'none';
        }
      }
    };

    // Wait for PDF to render
    const timer = setTimeout(updateCanvasSize, 100);
    return () => clearTimeout(timer);
  }, [currentPage, scale]);

  // Render highlights
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Clear existing highlights
    canvas.clear();

    // Filter extractions for current page
    const pageExtractions = extractions.filter(e => {
      // Assuming we need to match by some page data - for now using all since we don't have page in Extraction interface
      return e.coordinates.x !== 0 || e.coordinates.y !== 0; // Only show extractions with real coordinates
    });

    pageExtractions.forEach(extraction => {
      const isHighlighted = extraction.id === highlightedExtractionId;
      const coords = extraction.coordinates;

      // Skip if no valid coordinates
      if (coords.width === 0 && coords.height === 0) return;

      // Scale coordinates to match PDF zoom
      const rect = new Rect({
        left: coords.x * scale,
        top: coords.y * scale,
        width: coords.width * scale,
        height: coords.height * scale,
        fill: isHighlighted ? 'rgba(255, 193, 7, 0.3)' : 'rgba(59, 130, 246, 0.2)',
        stroke: isHighlighted ? '#FF9800' : '#3B82F6',
        strokeWidth: isHighlighted ? 3 : 2,
        selectable: false,
        evented: false,
        strokeDashArray: extraction.method === 'manual' ? undefined : [5, 5],
      });

      canvas.add(rect);

      // Add pulsing animation for highlighted extraction
      if (isHighlighted) {
        let opacity = 0.3;
        let increasing = true;
        
        const animate = () => {
          if (increasing) {
            opacity += 0.02;
            if (opacity >= 0.5) increasing = false;
          } else {
            opacity -= 0.02;
            if (opacity <= 0.3) increasing = true;
          }
          rect.set('fill', `rgba(255, 193, 7, ${opacity})`);
          canvas.renderAll();
          
          if (extraction.id === highlightedExtractionId) {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    });

    canvas.renderAll();
  }, [extractions, currentPage, scale, highlightedExtractionId]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div ref={pageRef} onMouseUp={onMouseUp}>
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={loading}
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
      <canvas ref={canvasRef} />
    </div>
  );
};
