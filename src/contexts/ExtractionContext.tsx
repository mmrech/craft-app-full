import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Extraction {
  id: string;
  fieldName: string;
  text: string;
  page: number;
  coordinates: { x: number; y: number; width: number; height: number };
  method: 'manual' | 'markdown-search' | 'ai';
  timestamp: number;
  documentName?: string;
}

interface ExtractionContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  activeField: string | null;
  setActiveField: (field: string | null) => void;
  activeFieldElement: HTMLInputElement | HTMLTextAreaElement | null;
  setActiveFieldElement: (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
  extractions: Extraction[];
  addExtraction: (extraction: Omit<Extraction, 'id' | 'timestamp'>) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (pages: number) => void;
  scale: number;
  setScale: (scale: number) => void;
  formData: Record<string, any>;
  updateFormData: (field: string, value: any) => void;
  currentDocumentName: string;
  setCurrentDocumentName: (name: string) => void;
  currentDocumentId: string | null;
  setCurrentDocumentId: (id: string | null) => void;
  saveExtraction: (extraction: Omit<Extraction, 'id' | 'timestamp'>) => Promise<void>;
  validationErrors: Record<string, string>;
  validateField: (fieldName: string, value: any, required?: boolean) => void;
  clearValidation: (fieldName: string) => void;
  stepCompletion: Record<number, number>;
  getStepProgress: (step: number) => number;
  requiredFields: Record<number, string[]>;
  highlightedExtractionId: string | null;
  setHighlightedExtractionId: (id: string | null) => void;
}

const ExtractionContext = createContext<ExtractionContextType | undefined>(undefined);

export const useExtraction = () => {
  const context = useContext(ExtractionContext);
  if (!context) {
    throw new Error('useExtraction must be used within ExtractionProvider');
  }
  return context;
};

export const ExtractionProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [activeFieldElement, setActiveFieldElement] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentDocumentName, setCurrentDocumentName] = useState<string>('');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [stepCompletion, setStepCompletion] = useState<Record<number, number>>({});
  const [highlightedExtractionId, setHighlightedExtractionId] = useState<string | null>(null);

  // Define required fields per step
  const requiredFields: Record<number, string[]> = {
    0: ['citation'], // Step 1: Study ID
    1: [], // Step 2: PICOT
    2: [], // Step 3: Baseline
    3: [], // Step 4: Imaging
    4: [], // Step 5: Interventions
    5: [], // Step 6: Study Arms
    6: [], // Step 7: Outcomes
    7: [], // Step 8: Complications
  };

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    const autoSaveTimeout = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        try {
          const draftData = JSON.stringify({
            formData,
            currentStep,
            timestamp: Date.now()
          });
          localStorage.setItem('extraction_draft', draftData);
          console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (error: any) {
          console.error('Auto-save failed:', error);
          
          // Handle localStorage quota exceeded
          if (error.name === 'QuotaExceededError') {
            toast.error('Storage quota exceeded. Some data may not be saved.');
            // Try to clear old drafts
            try {
              const keys = Object.keys(localStorage);
              keys.forEach(key => {
                if (key.startsWith('extraction_draft_old')) {
                  localStorage.removeItem(key);
                }
              });
            } catch (clearError) {
              console.error('Failed to clear old drafts:', clearError);
            }
          }
        }
      }
    }, 2000); // Debounce: wait 2 seconds after last change

    return () => clearTimeout(autoSaveTimeout);
  }, [formData, currentStep]);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('extraction_draft');
      if (saved) {
        const { formData: savedData, currentStep: savedStep, timestamp } = JSON.parse(saved);
        const hoursSinceLastSave = (Date.now() - timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave < 24 && Object.keys(savedData).length > 0) {
          toast.info('Draft recovered from last session', {
            action: {
              label: 'Restore',
              onClick: () => {
                setFormData(savedData);
                setCurrentStep(savedStep);
                toast.success('Draft restored successfully');
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  // Calculate step completion
  useEffect(() => {
    const newCompletion: Record<number, number> = {};
    
    Object.keys(requiredFields).forEach(stepKey => {
      const step = parseInt(stepKey);
      const fields = requiredFields[step];
      
      if (fields.length === 0) {
        // No required fields, check if any data exists
        const stepFieldsWithData = Object.keys(formData).filter(key => 
          formData[key] && formData[key].toString().trim() !== ''
        ).length;
        newCompletion[step] = stepFieldsWithData > 0 ? 50 : 0; // Partial completion if any data
      } else {
        const completedFields = fields.filter(field => 
          formData[field] && formData[field].toString().trim() !== ''
        ).length;
        newCompletion[step] = (completedFields / fields.length) * 100;
      }
    });
    
    setStepCompletion(newCompletion);
  }, [formData]);

  const addExtraction = (extraction: Omit<Extraction, 'id' | 'timestamp'>) => {
    const newExtraction: Extraction = {
      ...extraction,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setExtractions(prev => [...prev, newExtraction]);
  };

  const saveExtraction = async (extraction: Omit<Extraction, 'id' | 'timestamp'>) => {
    // Add to local state immediately
    addExtraction(extraction);
    
    // Save to database if document is tracked
    if (!currentDocumentId) {
      console.warn('No document ID set, skipping database save');
      return;
    }

    try {
      const { error } = await supabase
        .from('clinical_extractions')
        .insert({
          document_id: currentDocumentId,
          step_number: currentStep + 1,
          field_name: extraction.fieldName,
          extracted_text: extraction.text,
          page_number: extraction.page,
          coordinates: extraction.coordinates,
          method: extraction.method
        });

      if (error) {
        console.error('Error saving extraction:', error);
      }
    } catch (error) {
      console.error('Error saving extraction:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      clearValidation(field);
    }
  };

  const validateField = (fieldName: string, value: any, required: boolean = false) => {
    if (required && (!value || value.toString().trim() === '')) {
      setValidationErrors(prev => ({ ...prev, [fieldName]: 'This field is required' }));
      return false;
    } else {
      clearValidation(fieldName);
      return true;
    }
  };

  const clearValidation = (fieldName: string) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const getStepProgress = (step: number): number => {
    return stepCompletion[step] || 0;
  };

  return (
    <ExtractionContext.Provider value={{
      currentStep,
      setCurrentStep,
      activeField,
      setActiveField,
      activeFieldElement,
      setActiveFieldElement,
      extractions,
      addExtraction,
      saveExtraction,
      currentPage,
      setCurrentPage,
      totalPages,
      setTotalPages,
      scale,
      setScale,
      formData,
      updateFormData,
      currentDocumentName,
      setCurrentDocumentName,
      currentDocumentId,
      setCurrentDocumentId,
      validationErrors,
      validateField,
      clearValidation,
      stepCompletion,
      getStepProgress,
      requiredFields,
      highlightedExtractionId,
      setHighlightedExtractionId
    }}>
      {children}
    </ExtractionContext.Provider>
  );
};
