import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import FormPanel from "@/components/extraction/FormPanel";
import PdfPanel from "@/components/extraction/PdfPanel";
import TracePanel from "@/components/extraction/TracePanel";
import { ExtractionProvider } from "@/contexts/ExtractionContext";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ExtractionProvider>
      <div className="flex h-screen overflow-hidden bg-muted">
        <FormPanel />
        <PdfPanel />
        <TracePanel />
      </div>
    </ExtractionProvider>
  );
};

export default Index;
