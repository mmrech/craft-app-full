import { useExtraction } from "@/contexts/ExtractionContext";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const TracePanel = () => {
  const { extractions, setCurrentPage } = useExtraction();

  const handleExtractionClick = (extraction: any) => {
    setCurrentPage(extraction.page);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(extractions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `extraction_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Export</h4>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportJSON} className="text-xs flex-1">
            <Download className="w-3 h-3 mr-1" />
            JSON
          </Button>
          <Button size="sm" variant="outline" className="text-xs flex-1">
            <FileText className="w-3 h-3 mr-1" />
            CSV
          </Button>
        </div>
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
              className="bg-muted/50 border rounded p-2.5 cursor-pointer hover:bg-muted transition-all text-xs"
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
