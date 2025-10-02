import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useExtraction } from "@/contexts/ExtractionContext";
import { AIExtractionButton } from "../AIExtractionButton";

const Step6StudyArms = () => {
  const { formData, updateFormData } = useExtraction();
  const [arms, setArms] = useState<number[]>([]);

  const addArm = () => {
    setArms([...arms, Date.now()]);
  };

  const removeArm = (id: number) => {
    setArms(arms.filter(a => a !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-primary pb-2">
        <h2 className="text-xl font-bold">
          Step 6: Study Arms
        </h2>
        <AIExtractionButton
          extractionType="study_arms"
          pdfText={formData._pdfFullText as string}
          label="AI Extract Study Arms"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Define the distinct groups for comparison.
      </p>

      <div className="space-y-3">
        {arms.map((id) => (
          <div key={id} className="p-4 bg-muted/50 rounded border space-y-3">
            <h3 className="font-semibold text-sm">Study Arm</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input
                  value={formData[`arm_label_${id}`] || ''}
                  onChange={(e) => updateFormData(`arm_label_${id}`, e.target.value)}
                  placeholder="e.g., Surgical, Control"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sample Size (N)</Label>
                <Input
                  type="number"
                  value={formData[`arm_n_${id}`] || ''}
                  onChange={(e) => updateFormData(`arm_n_${id}`, e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeArm(id)}
            >
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addArm} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Study Arm
        </Button>
      </div>
    </div>
  );
};

export default Step6StudyArms;
