import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useExtraction } from "@/contexts/ExtractionContext";

const Step5Interventions = () => {
  const { formData, updateFormData } = useExtraction();
  const [indications, setIndications] = useState<number[]>([]);
  const [interventions, setInterventions] = useState<number[]>([]);

  const addIndication = () => {
    setIndications([...indications, Date.now()]);
  };

  const removeIndication = (id: number) => {
    setIndications(indications.filter(i => i !== id));
  };

  const addIntervention = () => {
    setInterventions([...interventions, Date.now()]);
  };

  const removeIntervention = (id: number) => {
    setInterventions(interventions.filter(i => i !== id));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b-2 border-primary pb-2">
        Step 5: Interventions
      </h2>

      <div>
        <h3 className="text-base font-semibold mb-3">Surgical Indications</h3>
        <div className="space-y-3">
          {indications.map((id) => (
            <div key={id} className="p-4 bg-muted/50 rounded border space-y-3">
              <h4 className="font-medium text-sm">Indication</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Sign/Symptom</Label>
                  <Select
                    value={formData[`indication_sign_${id}`] || ''}
                    onValueChange={(value) => updateFormData(`indication_sign_${id}`, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Drowsiness">Drowsiness</SelectItem>
                      <SelectItem value="GCS_Drop">Drop in GCS</SelectItem>
                      <SelectItem value="Imaging_Mass_Effect">Imaging signs of mass effect</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Count (N)</Label>
                  <Input
                    type="number"
                    value={formData[`indication_count_${id}`] || ''}
                    onChange={(e) => updateFormData(`indication_count_${id}`, e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeIndication(id)}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addIndication} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Indication
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3">Interventions</h3>
        <div className="space-y-3">
          {interventions.map((id) => (
            <div key={id} className="p-4 bg-muted/50 rounded border space-y-3">
              <h4 className="font-medium text-sm">Intervention Type</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Surgical Type</Label>
                  <Select
                    value={formData[`intervention_type_${id}`] || ''}
                    onValueChange={(value) => updateFormData(`intervention_type_${id}`, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SDC_EVD">SDC + EVD</SelectItem>
                      <SelectItem value="SDC_ALONE">SDC Alone</SelectItem>
                      <SelectItem value="EVD_ALONE">EVD Alone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Time To Surgery (Hours)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData[`intervention_time_${id}`] || ''}
                    onChange={(e) => updateFormData(`intervention_time_${id}`, e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duraplasty?</Label>
                  <Select
                    value={formData[`intervention_duraplasty_${id}`] || 'null'}
                    onValueChange={(value) => updateFormData(`intervention_duraplasty_${id}`, value)}
                  >
                    <SelectTrigger>
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
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeIntervention(id)}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addIntervention} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Intervention Type
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step5Interventions;
