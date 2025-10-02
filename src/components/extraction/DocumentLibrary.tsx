import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Trash2, Download, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { retryWithBackoff, getErrorMessage } from "@/lib/apiRetry";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface Document {
  id: string;
  name: string;
  storage_path: string;
  total_pages: number;
  created_at: string;
  file_size: number;
}

interface DocumentLibraryProps {
  onLoadDocument: (doc: Document) => void;
}

const DocumentLibrary = ({ onLoadDocument }: DocumentLibraryProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  const loadDocuments = async () => {
    if (!isOnline) {
      setError('No internet connection. Please check your connection and try again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      });

      setDocuments(data);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error('Failed to load documents', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [isOnline]);

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.name}"? This action cannot be undone.`)) return;

    if (!isOnline) {
      toast.error('Cannot delete while offline', {
        description: 'Please check your connection and try again.'
      });
      return;
    }

    try {
      await retryWithBackoff(async () => {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('pdf_documents')
          .remove([doc.storage_path]);

        if (storageError) throw storageError;

        // Delete from database (this will cascade delete extractions)
        const { error: dbError } = await supabase
          .from('documents')
          .delete()
          .eq('id', doc.id);

        if (dbError) throw dbError;
      });

      toast.success('Document deleted successfully');
      await loadDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      const errorMessage = getErrorMessage(error);
      toast.error('Failed to delete document', {
        description: errorMessage
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading documents...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Failed to load documents</p>
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={loadDocuments} variant="outline" size="sm" disabled={!isOnline}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {isOnline ? 'Try Again' : 'Offline'}
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No documents yet</p>
        <p className="text-xs mt-1">Upload a PDF to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm mb-3">Document Library ({documents.length})</h3>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-background border rounded-lg p-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate" title={doc.name}>
                  {doc.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{doc.total_pages} pages</span>
                  <span>•</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onLoadDocument(doc)}
              >
                <Download className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(doc)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default DocumentLibrary;
