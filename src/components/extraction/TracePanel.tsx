import { useExtraction } from "@/contexts/ExtractionContext";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { ExportService } from "@/lib/exportService";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TracePanel = () => {
  const { extractions, setCurrentPage, formData, setHighlightedExtractionId, highlightedExtractionId } = useExtraction();
  const { toast } = useToast();

  const handleExtractionClick = (extraction: any) => {
    setCurrentPage(extraction.page);
    setHighlightedExtractionId(extraction.id);
    
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedExtractionId(null);
    }, 3000);
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (extractions.length === 0) {
      toast({
        title: "No data to export",
        description: "Extract some data first",
        variant: "destructive"
      });
      return;
    }

    const exportData = [{
      documentId: 'current',
      documentName: 'Current Document',
      createdAt: new Date().toISOString(),
      totalPages: Math.max(...extractions.map(e => e.page), 0),
      fileSize: 0,
      formData,
      extractions: extractions.map(e => ({
        id: e.id,
        documentName: 'Current Document',
        extractedDate: new Date(e.timestamp).toISOString(),
        stepNumber: 0,
        fieldName: e.fieldName,
        extractedText: e.text,
        pageNumber: e.page,
        method: e.method
      }))
    }];

    const filename = ExportService.generateFilename('current_extractions', format);

    try {
      if (format === 'csv') {
        ExportService.exportToCSV(exportData, filename);
      } else if (format === 'xlsx') {
        ExportService.exportToExcel(exportData, filename);
      } else {
        ExportService.exportToJSON(exportData, filename);
      }

      toast({
        title: "Export successful",
        description: `Exported ${extractions.length} extraction(s) as ${format.toUpperCase()}`
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const uniquePages = new Set(extractions.map(e => e.page));

  return (
    <div className="w-[20%] bg-background border-l overflow-y-auto p-5">
      <h2 className="text-lg font-bold mb-4 border-b pb-2">Extraction Trace</h2>

      {/* Stats */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Extractions:</span>
          <span className="font-semibold">{extractions.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pages with data:</span>
          <span className="font-semibold">{uniquePages.size}</span>
        </div>
      </div>

      {/* Export Section */}
      <div className="mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              <FileText className="w-4 h-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Extractions Log */}
      <div className="space-y-2">
        {extractions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No extractions yet. Click a field and highlight text in the PDF.
          </p>
        ) : (
          extractions.slice().reverse().map((extraction) => (
            <div
              key={extraction.id}
              className={`bg-muted/50 border rounded p-2.5 cursor-pointer hover:bg-muted transition-all text-xs ${
                highlightedExtractionId === extraction.id ? 'ring-2 ring-primary animate-pulse' : ''
              }`}
              onClick={() => handleExtractionClick(extraction)}
            >
              <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">
                {extraction.fieldName}
              </div>
              <div className="bg-background p-1.5 rounded border-l-2 border-primary mb-1.5 break-words">
                "{extraction.text.substring(0, 100)}{extraction.text.length > 100 ? '...' : ''}"
              </div>
              <div className="text-muted-foreground text-[10px]">
                Page {extraction.page} | {extraction.method} | {new Date(extraction.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TracePanel;
