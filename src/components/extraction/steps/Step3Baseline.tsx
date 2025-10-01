import ExtractableField from "../ExtractableField";

const Step3Baseline = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b-2 border-primary pb-2">
        Step 3: Baseline
      </h2>

      <h3 className="text-base font-semibold mt-4">Sample Size</h3>
      <div className="grid grid-cols-3 gap-4">
        <ExtractableField
          name="totalN"
          label="Total N"
          type="number"
          required
        />
        <ExtractableField
          name="surgicalN"
          label="Surgical N"
          type="number"
        />
        <ExtractableField
          name="controlN"
          label="Control N"
          type="number"
        />
      </div>

      <h3 className="text-base font-semibold mt-4">Age Demographics</h3>
      <div className="p-4 bg-muted/50 rounded space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <ExtractableField
            name="ageMean"
            label="Age Mean"
            type="number"
            step="0.1"
          />
          <ExtractableField
            name="ageSD"
            label="Age SD"
            type="number"
            step="0.1"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <ExtractableField
            name="ageMedian"
            label="Age Median"
            type="number"
            step="0.1"
          />
          <ExtractableField
            name="ageIQR_lower"
            label="Age IQR (Lower/Q1)"
            type="number"
            step="0.1"
          />
          <ExtractableField
            name="ageIQR_upper"
            label="Age IQR (Upper/Q3)"
            type="number"
            step="0.1"
          />
        </div>
      </div>

      <h3 className="text-base font-semibold mt-4">Gender</h3>
      <div className="grid grid-cols-2 gap-4">
        <ExtractableField
          name="maleN"
          label="Male N"
          type="number"
        />
        <ExtractableField
          name="femaleN"
          label="Female N"
          type="number"
        />
      </div>

      <h3 className="text-base font-semibold mt-4">Baseline Clinical Scores</h3>
      <div className="grid grid-cols-3 gap-4">
        <ExtractableField
          name="prestrokeMRS"
          label="Pre-stroke mRS"
          type="number"
          step="0.1"
        />
        <ExtractableField
          name="nihssMean"
          label="NIHSS Mean/Median"
          type="number"
          step="0.1"
        />
        <ExtractableField
          name="gcsMean"
          label="GCS Mean/Median"
          type="number"
          step="0.1"
        />
      </div>
    </div>
  );
};

export default Step3Baseline;
