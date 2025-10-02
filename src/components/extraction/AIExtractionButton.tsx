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
  const { updateFormData, formData } = useExtraction();
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

  const convertBoundingBox = async (
    bbox: number[], 
    pageNumber: number, 
    documentId: string
  ): Promise<{ x: number, y: number, width: number, height: number }> => {
    try {
      const { data: pdfPage } = await supabase
        .from('pdf_extractions')
        .select('text_items')
        .eq('document_id', documentId)
        .eq('page_number', pageNumber)
        .maybeSingle();
      
      if (!pdfPage?.text_items) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      
      const items = pdfPage.text_items as any[];
      const pageWidth = Math.max(...items.map((item: any) => item.x + item.width));
      const pageHeight = Math.max(...items.map((item: any) => item.y + item.height));
      
      const [ymin, xmin, ymax, xmax] = bbox;
      
      return {
        x: xmin * pageWidth,
        y: ymin * pageHeight,
        width: (xmax - xmin) * pageWidth,
        height: (ymax - ymin) * pageHeight
      };
    } catch (error) {
      console.error('Error converting bounding box:', error);
      return { x: 0, y: 0, width: 0, height: 0 };
    }
  };

  const getStepNumber = (type: string): number => {
    const stepMap: Record<string, number> = {
      study_id: 1,
      picot: 2,
      baseline: 3,
      imaging: 4,
      interventions: 5,
      study_arms: 6,
      outcomes: 7,
      complications: 8
    };
    return stepMap[type] || 1;
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
      // Get current document ID from formData
      const currentDocumentId = formData._currentDocumentId;
      
      if (!currentDocumentId) {
        throw new Error('No document loaded');
      }

      // Fetch page images for vision processing
      const { data: pageImages } = await supabase
        .from('pdf_extractions')
        .select('page_number, page_image')
        .eq('document_id', currentDocumentId)
        .order('page_number');

      console.log(`Fetched ${pageImages?.length || 0} page images for vision processing`);

      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('extract-clinical-data', {
          body: { 
            pdfText: pdfText.slice(0, 50000),
            extractionType,
            currentData: {},
            pageImages: pageImages?.map(p => ({ 
              pageNumber: p.page_number, 
              imageBase64: p.page_image 
            })) || []
          }
        });

        if (error) throw error;
        return data;
      });

      if (!result.success) {
        throw new Error(result.error || "AI extraction failed");
      }

      // Update form data and save extractions with bounding boxes
      const extractedData = result.data;
      let extractionCount = 0;

      for (const [key, rawValue] of Object.entries(extractedData)) {
        // Handle nested structure (value, boundingBox, pageNumber)
        const isStructured = rawValue && typeof rawValue === 'object' && 'value' in rawValue;
        const fieldValue = isStructured ? (rawValue as any).value : rawValue;
        const boundingBox = isStructured ? (rawValue as any).boundingBox : null;
        const pageNumber = isStructured ? (rawValue as any).pageNumber : null;

        // Update form
        if (Array.isArray(fieldValue)) {
          handleArrayData(key, fieldValue);
          extractionCount++;
        } else if (fieldValue != null) {
          updateFormData(key, fieldValue);
          extractionCount++;

          // Save extraction with coordinates if available
          if (boundingBox && pageNumber && currentDocumentId) {
            try {
              const coordinates = await convertBoundingBox(boundingBox, pageNumber, currentDocumentId);
              
              await supabase.from('clinical_extractions').insert({
                document_id: currentDocumentId,
                field_name: key,
                extracted_text: String(fieldValue),
                page_number: pageNumber,
                coordinates: coordinates,
                step_number: getStepNumber(extractionType),
                method: 'ai'
              });
              
              console.log(`Saved extraction for ${key} with bounding box on page ${pageNumber}`);
            } catch (saveError) {
              console.error(`Error saving extraction for ${key}:`, saveError);
            }
          }
        }
      }

      toast({
        title: "AI Extraction Complete",
        description: `Extracted ${extractionCount} fields with location data. Please review and confirm.`,
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
