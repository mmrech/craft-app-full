import { useExtraction } from "@/contexts/ExtractionContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Circle } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import UserMenu from "./UserMenu";
import Step1StudyId from "./steps/Step1StudyId";
import Step2PICOT from "./steps/Step2PICOT";
import Step3Baseline from "./steps/Step3Baseline";
import Step4Imaging from "./steps/Step4Imaging";
import Step5Interventions from "./steps/Step5Interventions";
import Step6StudyArms from "./steps/Step6StudyArms";
import Step7Outcomes from "./steps/Step7Outcomes";
import Step8Complications from "./steps/Step8Complications";

const TOTAL_STEPS = 8;

const STEP_NAMES = [
  "Study ID",
  "PICO-T",
  "Baseline",
  "Imaging",
  "Interventions",
  "Study Arms",
  "Outcomes",
  "Complications"
];

const FormPanel = () => {
  const { currentStep, setCurrentStep, getStepProgress, validationErrors, requiredFields, formData } = useExtraction();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowRight' && currentStep < TOTAL_STEPS - 1) {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowLeft' && currentStep > 0) {
          e.preventDefault();
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const steps = [
    <Step1StudyId key="step1" />,
    <Step2PICOT key="step2" />,
    <Step3Baseline key="step3" />,
    <Step4Imaging key="step4" />,
    <Step5Interventions key="step5" />,
    <Step6StudyArms key="step6" />,
    <Step7Outcomes key="step7" />,
    <Step8Complications key="step8" />
  ];

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const handleNext = () => {
    // Validate required fields for current step
    const stepRequiredFields = requiredFields[currentStep] || [];
    const missingFields = stepRequiredFields.filter(field => 
      !formData[field] || formData[field].toString().trim() === ''
    );

    if (missingFields.length > 0) {
      toast.error(`Please complete required fields before proceeding`);
      return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    const allRequiredFields = Object.values(requiredFields).flat();
    const missingFields = allRequiredFields.filter(field => 
      !formData[field] || formData[field].toString().trim() === ''
    );

    if (missingFields.length > 0) {
      toast.error(`Please complete all required fields: ${missingFields.join(', ')}`);
      return;
    }

    toast.success('Extraction completed successfully!');
    console.log('Extraction complete!', formData);
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="w-[35%] bg-background overflow-y-auto">
      <div className="p-6 pb-24">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Clinical Study Master Extraction</h1>
          <UserMenu />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Click a field, then highlight text in the PDF to extract with full traceability.
        </p>

        <div className="mb-6 space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
          
          {/* Step indicators */}
          <div className="grid grid-cols-8 gap-1 mt-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
              const stepProgress = getStepProgress(index);
              const isComplete = stepProgress === 100;
              const isCurrent = index === currentStep;
              
              return (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={`
                    relative h-10 rounded flex flex-col items-center justify-center text-xs font-medium
                    transition-all duration-200
                    ${isCurrent ? 'bg-primary text-primary-foreground shadow-md scale-105' : ''}
                    ${!isCurrent && isComplete ? 'bg-accent text-accent-foreground' : ''}
                    ${!isCurrent && !isComplete && stepProgress > 0 ? 'bg-secondary text-secondary-foreground' : ''}
                    ${!isCurrent && stepProgress === 0 ? 'bg-muted text-muted-foreground' : ''}
                    hover:scale-105 hover:shadow-sm
                  `}
                  title={`${STEP_NAMES[index]} - ${Math.round(stepProgress)}% complete`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  {stepProgress > 0 && stepProgress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30 rounded-b">
                      <div 
                        className="h-full bg-primary rounded-b transition-all" 
                        style={{ width: `${stepProgress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {steps[currentStep]}
        </div>

        {/* Keyboard shortcut hint */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          💡 <span className="font-semibold">Keyboard shortcuts:</span> Ctrl/Cmd + ← → to navigate steps
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 w-[35%] bg-background border-t border-border p-4 flex justify-between items-center">
        <div className="text-sm font-medium">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePrev}
            disabled={currentStep === 0}
            variant="outline"
          >
            Previous
          </Button>
          {currentStep < TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleFinish} variant="medical">
              Finish Extraction
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormPanel;
