import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useExtraction } from "@/contexts/ExtractionContext";
import { AIExtractionButton } from "../AIExtractionButton";

const Step7Outcomes = () => {
  const { formData, updateFormData } = useExtraction();
  const [mortalityData, setMortalityData] = useState<number[]>([]);
  const [mrsData, setMrsData] = useState<number[]>([]);

  const addMortality = () => {
    setMortalityData([...mortalityData, Date.now()]);
  };

  const removeMortality = (id: number) => {
    setMortalityData(mortalityData.filter(m => m !== id));
  };

  const addMRS = () => {
    setMrsData([...mrsData, Date.now()]);
  };

  const removeMRS = (id: number) => {
    setMrsData(mrsData.filter(m => m !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2">
        <h2 className="text-xl font-bold">
          Step 7: Outcomes
        </h2>
        <AIExtractionButton
          extractionType="outcomes"
          pdfText={formData._pdfFullText as string}
          label="AI Extract Outcomes"
        />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3">Mortality Data</h3>
        <div className="space-y-3">
          {mortalityData.map((id) => (
            <div key={id} className="p-4 bg-muted/50 rounded border space-y-3">
              <h4 className="font-medium text-sm">Mortality Data Point</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Arm</Label>
                  <Input
                    value={formData[`mortality_arm_${id}`] || ''}
                    onChange={(e) => updateFormData(`mortality_arm_${id}`, e.target.value)}
                    placeholder="e.g., Surgical"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Timepoint</Label>
                  <Input
                    value={formData[`mortality_tp_${id}`] || ''}
                    onChange={(e) => updateFormData(`mortality_tp_${id}`, e.target.value)}
                    placeholder="e.g., 30 days"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Deaths (N)</Label>
                  <Input
                    type="number"
                    value={formData[`mortality_deaths_${id}`] || ''}
                    onChange={(e) => updateFormData(`mortality_deaths_${id}`, e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Total (N)</Label>
                  <Input
                    type="number"
                    value={formData[`mortality_total_${id}`] || ''}
                    onChange={(e) => updateFormData(`mortality_total_${id}`, e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeMortality(id)}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addMortality} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Mortality Data
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3">Modified Rankin Scale (mRS)</h3>
        <div className="space-y-3">
          {mrsData.map((id) => (
            <div key={id} className="p-4 bg-muted/50 rounded border space-y-3">
              <h4 className="font-medium text-sm">mRS Data Point</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Arm</Label>
                  <Input
                    value={formData[`mrs_arm_${id}`] || ''}
                    onChange={(e) => updateFormData(`mrs_arm_${id}`, e.target.value)}
                    placeholder="e.g., Surgical"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Timepoint</Label>
                  <Input
                    value={formData[`mrs_tp_${id}`] || ''}
                    onChange={(e) => updateFormData(`mrs_tp_${id}`, e.target.value)}
                    placeholder="e.g., 90 days"
                  />
                </div>
              </div>
              <h5 className="text-sm font-medium">Distribution (Counts)</h5>
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((score) => (
                  <div key={score} className="space-y-1">
                    <Label className="text-xs">{score}</Label>
                    <Input
                      type="number"
                      value={formData[`mrs_${score}_${id}`] || ''}
                      onChange={(e) => updateFormData(`mrs_${score}_${id}`, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeMRS(id)}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addMRS} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add mRS Data
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step7Outcomes;
