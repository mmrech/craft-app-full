import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Extraction {
  id: string;
  fieldName: string;
  text: string;
  page: number;
  coordinates: { x: number; y: number; width: number; height: number };
  method: 'manual' | 'markdown-search';
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
  pdfDoc: any;
  setPdfDoc: (doc: any) => void;
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
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentDocumentName, setCurrentDocumentName] = useState<string>('');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);

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
      pdfDoc,
      setPdfDoc,
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
      setCurrentDocumentId
    }}>
      {children}
    </ExtractionContext.Provider>
  );
};
