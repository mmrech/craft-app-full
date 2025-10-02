import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";

interface Extraction {
  id: string;
  fieldName: string;
  page: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [highlightOpacity, setHighlightOpacity] = useState(0.3);

  // Filter extractions for current page
  const pageExtractions = extractions.filter(e => {
    return e.page === currentPage && (e.coordinates.x !== 0 || e.coordinates.y !== 0);
  });

  // Pulsing animation for highlighted extraction
  useEffect(() => {
    if (!highlightedExtractionId) return;

    let opacity = 0.3;
    let increasing = true;
    let animationFrameId: number;

    const animate = () => {
      if (increasing) {
        opacity += 0.02;
        if (opacity >= 0.5) increasing = false;
      } else {
        opacity -= 0.02;
        if (opacity <= 0.3) increasing = true;
      }
      setHighlightOpacity(opacity);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [highlightedExtractionId]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'block', width: 'fit-content', margin: '0 auto' }}>
      <div ref={pageRef} onMouseUp={onMouseUp} style={{ position: 'relative' }}>
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
        
        {/* CSS-based highlight overlays */}
        {pageExtractions.map((extraction) => {
          const isHighlighted = extraction.id === highlightedExtractionId;
          const coords = extraction.coordinates;

          // Skip if no valid coordinates
          if (coords.width === 0 && coords.height === 0) return null;

          return (
            <div
              key={extraction.id}
              style={{
                position: 'absolute',
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                width: `${coords.width}px`,
                height: `${coords.height}px`,
                backgroundColor: isHighlighted 
                  ? `rgba(255, 193, 7, ${highlightOpacity})` 
                  : 'rgba(59, 130, 246, 0.2)',
                border: isHighlighted 
                  ? '3px solid #FF9800' 
                  : '2px solid #3B82F6',
                borderStyle: extraction.method === 'manual' ? 'solid' : 'dashed',
                pointerEvents: 'none',
                zIndex: 10,
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
