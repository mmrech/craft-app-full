import { useExtraction } from "@/contexts/ExtractionContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Step1StudyId from "./steps/Step1StudyId";
import Step2PICOT from "./steps/Step2PICOT";
import Step3Baseline from "./steps/Step3Baseline";
import Step4Imaging from "./steps/Step4Imaging";
import Step5Interventions from "./steps/Step5Interventions";
import Step6StudyArms from "./steps/Step6StudyArms";
import Step7Outcomes from "./steps/Step7Outcomes";
import Step8Complications from "./steps/Step8Complications";

const TOTAL_STEPS = 8;

const FormPanel = () => {
  const { currentStep, setCurrentStep } = useExtraction();

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
    console.log('Extraction complete!');
  };

  return (
    <div className="w-[35%] bg-background overflow-y-auto">
      <div className="p-6 pb-24">
        <h1 className="text-2xl font-bold mb-2">Clinical Study Master Extraction</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Click a field, then highlight text in the PDF to extract with full traceability.
        </p>

        <div className="mb-6">
          <Progress value={progress} className="h-2.5" />
        </div>

        <div className="space-y-6">
          {steps[currentStep]}
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
