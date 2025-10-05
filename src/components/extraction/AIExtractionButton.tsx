import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
// Supabase removed for local-only operation
import { useToast } from "@/hooks/use-toast";
import { useExtraction } from "@/contexts/ExtractionContext";
// Removed network and API retry imports for local-only operation

interface AIExtractionButtonProps {
  extractionType: 'study_id' | 'picot' | 'baseline' | 'imaging' | 'interventions' | 'study_arms' | 'outcomes' | 'complications' | 'full_study';
  pdfText: string;
  label?: string;
  disabled?: boolean;
}

export const AIExtractionButton = ({ 
  extractionType, 
  pdfText, 
  label = "AI Extract",
  disabled = false 
}: AIExtractionButtonProps) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { updateFormData } = useExtraction();
  const { toast } = useToast();
  // Network status removed for local-only operation

  const handleArrayData = (key: string, arrayData: any[]) => {
    // Handle different array types and convert to dynamic field names
    switch (key) {
      case 'arms':
        // Study arms: arm_label_${id}, arm_n_${id}
        arrayData.forEach((arm, index) => {
          const id = Date.now() + index;
          updateFormData(`arm_label_${id}`, arm.label || '');
          updateFormData(`arm_n_${id}`, arm.sampleSize?.toString() || '');
        });
        break;
      
      case 'indications':
        // Surgical indications: indication_sign_${id}, indication_count_${id}
        arrayData.forEach((indication, index) => {
          const id = Date.now() + index;
          updateFormData(`indication_sign_${id}`, indication.sign || '');
          updateFormData(`indication_count_${id}`, indication.count?.toString() || '');
        });
        break;
      
      case 'interventions':
        // Interventions: intervention_type_${id}, intervention_time_${id}, intervention_duraplasty_${id}
        arrayData.forEach((intervention, index) => {
          const id = Date.now() + index;
          updateFormData(`intervention_type_${id}`, intervention.type || '');
          updateFormData(`intervention_time_${id}`, intervention.timeToSurgery?.toString() || '');
          updateFormData(`intervention_duraplasty_${id}`, intervention.duraplasty || '');
        });
        break;
      
      case 'mortality':
        // Mortality data: mortality_arm_${id}, mortality_tp_${id}, mortality_deaths_${id}, mortality_total_${id}
        arrayData.forEach((mortality, index) => {
          const id = Date.now() + index;
          updateFormData(`mortality_arm_${id}`, mortality.arm || '');
          updateFormData(`mortality_tp_${id}`, mortality.timepoint || '');
          updateFormData(`mortality_deaths_${id}`, mortality.deaths?.toString() || '');
          updateFormData(`mortality_total_${id}`, mortality.total?.toString() || '');
        });
        break;
      
      case 'mrsData':
        // mRS data: mrs_arm_${id}, mrs_tp_${id}, mrs_0_${id}, mrs_1_${id}, etc.
        arrayData.forEach((mrs, index) => {
          const id = Date.now() + index;
          updateFormData(`mrs_arm_${id}`, mrs.arm || '');
          updateFormData(`mrs_tp_${id}`, mrs.timepoint || '');
          for (let i = 0; i <= 6; i++) {
            updateFormData(`mrs_${i}_${id}`, mrs[`score${i}`]?.toString() || '');
          }
        });
        break;
      
      case 'complications':
        // Complications: comp_desc_${id}, comp_arm_${id}, comp_count_${id}
        arrayData.forEach((complication, index) => {
          const id = Date.now() + index;
          updateFormData(`comp_desc_${id}`, complication.description || '');
          updateFormData(`comp_arm_${id}`, complication.arm || '');
          updateFormData(`comp_count_${id}`, complication.count?.toString() || '');
        });
        break;
      
      case 'predictors':
        // Predictors: pred_var_${id}, pred_effect_${id}, pred_ci_lower_${id}, pred_ci_upper_${id}, pred_pvalue_${id}
        arrayData.forEach((predictor, index) => {
          const id = Date.now() + index;
          updateFormData(`pred_var_${id}`, predictor.variable || '');
          updateFormData(`pred_effect_${id}`, predictor.effectSize?.toString() || '');
          updateFormData(`pred_ci_lower_${id}`, predictor.ciLower?.toString() || '');
          updateFormData(`pred_ci_upper_${id}`, predictor.ciUpper?.toString() || '');
          updateFormData(`pred_pvalue_${id}`, predictor.pValue?.toString() || '');
        });
        break;
    }
  };

  const handleAIExtraction = async () => {
    toast({
      title: "AI Extraction Not Available",
      description: "AI extraction is disabled in the local-only version. Please use manual extraction by clicking fields and highlighting text.",
      variant: "destructive",
    });
  };

  return (
    <Button
      onClick={handleAIExtraction}
      disabled={disabled || isExtracting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isExtracting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Extracting...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {label}
        </>
      )}
    </Button>
  );
};
