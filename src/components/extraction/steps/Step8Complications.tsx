import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ExtractableField from "../ExtractableField";
import { Plus, X } from "lucide-react";
import { useExtraction } from "@/contexts/ExtractionContext";
import { AIExtractionButton } from "../AIExtractionButton";

const Step8Complications = () => {
  const { formData, updateFormData } = useExtraction();
  const [complications, setComplications] = useState<number[]>([]);
  const [predictors, setPredictors] = useState<number[]>([]);

  const addComplication = () => {
    setComplications([...complications, Date.now()]);
  };

  const removeComplication = (id: number) => {
    setComplications(complications.filter(c => c !== id));
  };

  const addPredictor = () => {
    setPredictors([...predictors, Date.now()]);
  };

  const removePredictor = (id: number) => {
    setPredictors(predictors.filter(p => p !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2">
        <h2 className="text-xl font-bold">
          Step 8: Complications
        </h2>
        <AIExtractionButton
          extractionType="complications"
          pdfText={formData._pdfFullText as string}
          label="AI Extract Complications"
        />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3">Complications</h3>
        <div className="space-y-3">
          {complications.map((id) => (
            <div key={id} className="p-4 bg-muted/50 rounded border space-y-3">
              <h4 className="font-medium text-sm">Complication</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    value={formData[`comp_desc_${id}`] || ''}
                    onChange={(e) => updateFormData(`comp_desc_${id}`, e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Arm</Label>
                  <Input
                    value={formData[`comp_arm_${id}`] || ''}
                    onChange={(e) => updateFormData(`comp_arm_${id}`, e.target.value)}
                    placeholder="e.g., Surgical"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Count (N)</Label>
                <Input
                  type="number"
                  value={formData[`comp_count_${id}`] || ''}
                  onChange={(e) => updateFormData(`comp_count_${id}`, e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeComplication(id)}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addComplication} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Complication
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mt-4">Predictors of Outcome</h3>
        <ExtractableField
          name="predictorsPoorOutcomeSurgical"
          label="Summary of Predictors"
          type="textarea"
        />

        <h4 className="text-sm font-medium mt-4 mb-3">Predictor Analysis</h4>
        <div className="space-y-3">
          {predictors.map((id) => (
            <div key={id} className="p-4 bg-muted/50 rounded border space-y-3">
              <h4 className="font-medium text-sm">Predictor Analysis</h4>
              <div className="space-y-1.5">
                <Label>Predictor Variable</Label>
                <Input
                  value={formData[`pred_var_${id}`] || ''}
                  onChange={(e) => updateFormData(`pred_var_${id}`, e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Effect Size (OR/HR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData[`pred_effect_${id}`] || ''}
                    onChange={(e) => updateFormData(`pred_effect_${id}`, e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>95% CI (Lower)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData[`pred_ci_lower_${id}`] || ''}
                    onChange={(e) => updateFormData(`pred_ci_lower_${id}`, e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>95% CI (Upper)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData[`pred_ci_upper_${id}`] || ''}
                    onChange={(e) => updateFormData(`pred_ci_upper_${id}`, e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>p-Value</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData[`pred_pvalue_${id}`] || ''}
                  onChange={(e) => updateFormData(`pred_pvalue_${id}`, e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removePredictor(id)}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addPredictor} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Predictor
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step8Complications;
