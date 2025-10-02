import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Filter, FileSpreadsheet, FileJson } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExportService, DocumentExportData } from "@/lib/exportService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentRecord {
  id: string;
  name: string;
  created_at: string;
  total_pages: number;
  file_size: number;
  extractionCount: number;
}

const ExtractedDataView = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id, name, created_at, total_pages, file_size')
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      const { data: extractionsData, error: extractionsError } = await supabase
        .from('clinical_extractions')
        .select('document_id');

      if (extractionsError) throw extractionsError;

      const extractionCounts = extractionsData.reduce((acc, ext) => {
        acc[ext.document_id] = (acc[ext.document_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const enrichedDocs = docsData.map(doc => ({
        ...doc,
        extractionCount: extractionCounts[doc.id] || 0
      }));

      setDocuments(enrichedDocs);
    } catch (error: any) {
      toast({
        title: "Error loading documents",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    try {
      const docsToExport = selectedDocs.size > 0 
        ? documents.filter(d => selectedDocs.has(d.id))
        : documents;

      if (docsToExport.length === 0) {
        toast({
          title: "No documents to export",
          description: "Please select at least one document",
          variant: "destructive"
        });
        return;
      }

      const exportData: DocumentExportData[] = [];

      for (const doc of docsToExport) {
        const { data: extractions, error } = await supabase
          .from('clinical_extractions')
          .select('*')
          .eq('document_id', doc.id);

        if (error) throw error;

        exportData.push({
          documentId: doc.id,
          documentName: doc.name,
          createdAt: doc.created_at,
          totalPages: doc.total_pages || 0,
          fileSize: doc.file_size || 0,
          formData: {},
          extractions: extractions.map(e => ({
            id: e.id,
            documentName: doc.name,
            extractedDate: e.created_at,
            stepNumber: e.step_number,
            fieldName: e.field_name,
            extractedText: e.extracted_text,
            pageNumber: e.page_number,
            method: e.method
          }))
        });
      }

      const filename = ExportService.generateFilename(
        selectedDocs.size > 0 ? 'selected_extractions' : 'all_extractions',
        format
      );

      if (format === 'csv') {
        ExportService.exportToCSV(exportData, filename);
      } else if (format === 'xlsx') {
        ExportService.exportToExcel(exportData, filename);
      } else {
        ExportService.exportToJSON(exportData, filename);
      }

      toast({
        title: "Export successful",
        description: `Exported ${docsToExport.length} document(s) as ${format.toUpperCase()}`
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleDocSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Extracted Data Records</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all extracted clinical data
            </p>
          </div>
          <div className="flex gap-2">
            {selectedDocs.size > 0 && (
              <Badge variant="secondary" className="self-center">
                {selectedDocs.size} selected
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by document name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                </TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead>Extractions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/30">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleDocSelection(doc.id)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{doc.total_pages || 'N/A'}</TableCell>
                    <TableCell>
                      {doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{doc.extractionCount}</span> fields
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Total Documents</h3>
          <p className="text-3xl font-bold text-primary">{documents.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Across all users</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Total Extractions</h3>
          <p className="text-3xl font-bold text-primary">
            {documents.reduce((sum, doc) => sum + doc.extractionCount, 0)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">All extracted fields</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Average Fields</h3>
          <p className="text-3xl font-bold text-accent">
            {documents.length > 0 
              ? (documents.reduce((sum, doc) => sum + doc.extractionCount, 0) / documents.length).toFixed(1)
              : '0'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Per document</p>
        </Card>
      </div>
    </div>
  );
};

export default ExtractedDataView;
