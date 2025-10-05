import FormPanel from "@/components/extraction/FormPanel";
import PdfPanel from "@/components/extraction/PdfPanel";
import TracePanel from "@/components/extraction/TracePanel";
import { ExtractionProvider } from "@/contexts/ExtractionContext";

const Index = () => {
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
