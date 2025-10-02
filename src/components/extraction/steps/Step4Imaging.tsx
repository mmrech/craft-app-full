import ExtractableField from "../ExtractableField";
import { ValidatedField } from "../ValidatedField";
import { AIExtractionButton } from "../AIExtractionButton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExtraction } from "@/contexts/ExtractionContext";

const Step4Imaging = () => {
  const { formData, updateFormData } = useExtraction();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2">
        <h2 className="text-xl font-bold">
          Step 4: Imaging
        </h2>
        <AIExtractionButton
          extractionType="imaging"
          pdfText={formData._pdfFullText as string}
          label="AI Extract Imaging"
        />
      </div>

      <ExtractableField
        name="vascularTerritory"
        label="Vascular Territory"
      />

      <div className="grid grid-cols-2 gap-4">
        <ValidatedField
          name="infarctVolume"
          label="Infarct Volume (mL)"
          type="number"
          step="0.1"
          placeholder="25.5"
        />
        <ExtractableField
          name="strokeVolumeCerebellum"
          label="Stroke Volume (Cerebellum)"
        />
      </div>

      <h3 className="text-base font-semibold mt-4">Edema Dynamics</h3>
      <ExtractableField
        name="edemaDynamics"
        label="Edema Description"
        type="textarea"
      />

      <ExtractableField
        name="peakSwellingWindow"
        label="Peak Swelling Window"
      />

      <h3 className="text-base font-semibold mt-4">Involvement Areas</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5 p-2 rounded">
          <Label htmlFor="brainstemInvolvement" className="font-semibold">
            Brainstem Involvement?
          </Label>
          <Select
            value={formData['brainstemInvolvement'] || 'null'}
            onValueChange={(value) => updateFormData('brainstemInvolvement', value)}
          >
            <SelectTrigger id="brainstemInvolvement">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Unknown</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 p-2 rounded">
          <Label htmlFor="supratentorialInvolvement" className="font-semibold">
            Supratentorial?
          </Label>
          <Select
            value={formData['supratentorialInvolvement'] || 'null'}
            onValueChange={(value) => updateFormData('supratentorialInvolvement', value)}
          >
            <SelectTrigger id="supratentorialInvolvement">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Unknown</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 p-2 rounded">
          <Label htmlFor="nonCerebellarStroke" className="font-semibold">
            Non-cerebellar?
          </Label>
          <Select
            value={formData['nonCerebellarStroke'] || 'null'}
            onValueChange={(value) => updateFormData('nonCerebellarStroke', value)}
          >
            <SelectTrigger id="nonCerebellarStroke">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Unknown</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default Step4Imaging;
