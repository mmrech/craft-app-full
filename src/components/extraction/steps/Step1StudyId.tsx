import ExtractableField from "../ExtractableField";
import { AIExtractionButton } from "../AIExtractionButton";
import { useExtraction } from "@/contexts/ExtractionContext";

const Step1StudyId = () => {
  const { formData } = useExtraction();
  
  // Get all PDF text from context (you'll need to add this to context)
  const pdfText = formData._pdfFullText || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2">
        <h2 className="text-xl font-bold">
          Step 1: Study ID
        </h2>
        <AIExtractionButton 
          extractionType="study_id"
          pdfText={pdfText}
          label="AI Extract All"
        />
      </div>

      <ExtractableField
        name="citation"
        label="Full Citation"
        type="textarea"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <ExtractableField name="doi" label="DOI" />
        <ExtractableField name="pmid" label="PMID" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ExtractableField name="journal" label="Journal" />
        <ExtractableField name="year" label="Year" type="number" />
        <ExtractableField name="country" label="Country" />
      </div>

      <ExtractableField
        name="centers"
        label="Centers (e.g., Single, Multi)"
      />

      <ExtractableField
        name="funding"
        label="Funding Sources"
        type="textarea"
      />

      <ExtractableField
        name="conflicts"
        label="Conflicts of Interest"
        type="textarea"
      />

      <ExtractableField
        name="registration"
        label="Trial Registration ID"
      />
    </div>
  );
};

export default Step1StudyId;
