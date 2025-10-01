import ExtractableField from "../ExtractableField";

const Step1StudyId = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b-2 border-primary pb-2">
        Step 1: Study ID
      </h2>

      <ExtractableField
        name="citation"
        label="Full Citation"
        type="textarea"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <ExtractableField name="doi" label="DOI" />
        <ExtractableField name="pmid" label="PMID" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ExtractableField name="journal" label="Journal" />
        <ExtractableField name="year" label="Year" type="number" />
        <ExtractableField name="country" label="Country" />
      </div>

      <ExtractableField
        name="centers"
        label="Centers (e.g., Single, Multi)"
      />

      <ExtractableField
        name="funding"
        label="Funding Sources"
        type="textarea"
      />

      <ExtractableField
        name="conflicts"
        label="Conflicts of Interest"
        type="textarea"
      />

      <ExtractableField
        name="registration"
        label="Trial Registration ID"
      />
    </div>
  );
};

export default Step1StudyId;
