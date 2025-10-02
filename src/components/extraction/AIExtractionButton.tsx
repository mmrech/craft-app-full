import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useExtraction } from "@/contexts/ExtractionContext";
import { retryWithBackoff, getErrorMessage } from "@/lib/apiRetry";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

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
  const { isOnline } = useNetworkStatus();

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
    if (!isOnline) {
      toast({
        title: "No internet connection",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
      return;
    }

    if (!pdfText || pdfText.trim().length === 0) {
      toast({
        title: "No PDF text available",
        description: "Please load a document first",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('extract-clinical-data', {
          body: { 
            pdfText: pdfText.slice(0, 50000), // Limit to first 50k chars for initial extraction
            extractionType,
            currentData: {}
          }
        });

        if (error) throw error;
        return data;
      });

      if (!result.success) {
        throw new Error(result.error || "AI extraction failed");
      }

      // Update form data with extracted values
      const extractedData = result.data;
      const confidence = extractedData.confidence || {};

      Object.entries(extractedData).forEach(([key, value]) => {
        if (key !== 'confidence' && value) {
          // Handle array data types (for study arms, interventions, outcomes, complications)
          if (Array.isArray(value)) {
            handleArrayData(key, value);
          } else {
            updateFormData(key, value);
          }
        }
      });

      // Show confidence scores in toast
      const confidenceValues = Object.values(confidence).filter((v): v is number => typeof v === 'number');
      const avgConfidence = confidenceValues.length > 0
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
        : 0;

      toast({
        title: "AI Extraction Complete",
        description: `Extracted ${Object.keys(extractedData).length - 1} fields ${
          avgConfidence > 0 ? `(${(avgConfidence * 100).toFixed(0)}% confidence)` : ''
        }. Please review and confirm.`,
      });

    } catch (error: any) {
      console.error('AI extraction error:', error);
      const errorMessage = getErrorMessage(error);
      
      toast({
        title: "AI Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Button
      onClick={handleAIExtraction}
      disabled={disabled || isExtracting || !isOnline}
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
