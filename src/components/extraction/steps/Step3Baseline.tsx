import ExtractableField from "../ExtractableField";
import { ValidatedField } from "../ValidatedField";
import { AIExtractionButton } from "../AIExtractionButton";
import { useExtraction } from "@/contexts/ExtractionContext";

const Step3Baseline = () => {
  const { formData } = useExtraction();
  const pdfText = formData._pdfFullText || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2">
        <h2 className="text-xl font-bold">
          Step 3: Baseline
        </h2>
        <AIExtractionButton 
          extractionType="baseline"
          pdfText={pdfText}
          label="AI Extract Baseline"
        />
      </div>

      <h3 className="text-base font-semibold mt-4">Sample Size</h3>
      <div className="grid grid-cols-3 gap-4">
        <ValidatedField
          name="totalN"
          label="Total N"
          type="number"
          placeholder="100"
        />
        <ExtractableField
          name="surgicalN"
          label="Surgical N"
          type="number"
        />
        <ExtractableField
          name="controlN"
          label="Control N"
          type="number"
        />
      </div>

      <h3 className="text-base font-semibold mt-4">Age Demographics</h3>
      <div className="p-4 bg-muted/50 rounded space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <ValidatedField
            name="meanAge"
            label="Age Mean"
            type="number"
            step="0.1"
            placeholder="65.5"
          />
          <ValidatedField
            name="sdAge"
            label="Age SD"
            type="number"
            step="0.1"
            placeholder="12.3"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <ExtractableField
            name="ageMedian"
            label="Age Median"
            type="number"
            step="0.1"
          />
          <ExtractableField
            name="ageIQR_lower"
            label="Age IQR (Lower/Q1)"
            type="number"
            step="0.1"
          />
          <ExtractableField
            name="ageIQR_upper"
            label="Age IQR (Upper/Q3)"
            type="number"
            step="0.1"
          />
        </div>
      </div>

      <h3 className="text-base font-semibold mt-4">Gender</h3>
      <div className="grid grid-cols-2 gap-4">
        <ValidatedField
          name="totalMale"
          label="Male N"
          type="number"
          placeholder="55"
        />
        <ValidatedField
          name="totalFemale"
          label="Female N"
          type="number"
          placeholder="45"
        />
      </div>

      <h3 className="text-base font-semibold mt-4">Baseline Clinical Scores</h3>
      <div className="grid grid-cols-3 gap-4">
        <ExtractableField
          name="prestrokeMRS"
          label="Pre-stroke mRS"
          type="number"
          step="0.1"
        />
        <ExtractableField
          name="nihssMean"
          label="NIHSS Mean/Median"
          type="number"
          step="0.1"
        />
        <ExtractableField
          name="gcsMean"
          label="GCS Mean/Median"
          type="number"
          step="0.1"
        />
      </div>
    </div>
  );
};

export default Step3Baseline;
