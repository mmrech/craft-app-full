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
          updateFormData(key, value);
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
