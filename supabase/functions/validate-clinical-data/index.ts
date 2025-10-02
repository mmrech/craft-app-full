import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fieldName, fieldValue, formData } = await req.json();

    console.log(`Validating field: ${fieldName}`);

    const validations = await performValidation(fieldName, fieldValue, formData);

    return new Response(
      JSON.stringify({
        success: true,
        validations
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function performValidation(fieldName: string, fieldValue: any, formData: any) {
  const validations: any[] = [];

  // DOI validation
  if (fieldName === 'doi') {
    if (fieldValue && typeof fieldValue === 'string') {
      const doiPattern = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
      if (!doiPattern.test(fieldValue)) {
        validations.push({
          field: 'doi',
          type: 'error',
          message: 'Invalid DOI format. Should start with 10. followed by publisher code and suffix',
          suggestion: 'Check the format: 10.XXXX/suffix'
        });
      } else {
        validations.push({
          field: 'doi',
          type: 'success',
          message: 'DOI format is valid'
        });
      }
    }
  }

  // PMID validation
  if (fieldName === 'pmid') {
    if (fieldValue && typeof fieldValue === 'string') {
      const pmidPattern = /^\d{1,8}$/;
      if (!pmidPattern.test(fieldValue)) {
        validations.push({
          field: 'pmid',
          type: 'error',
          message: 'Invalid PMID format. Should be 1-8 digits',
          suggestion: 'PMID should only contain numbers (e.g., 12345678)'
        });
      } else {
        validations.push({
          field: 'pmid',
          type: 'success',
          message: 'PMID format is valid'
        });
      }
    }
  }

  // Year validation
  if (fieldName === 'year') {
    if (fieldValue) {
      const year = parseInt(fieldValue);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        validations.push({
          field: 'year',
          type: 'error',
          message: `Year should be between 1900 and ${currentYear + 1}`,
          suggestion: `Check if the year ${fieldValue} is correct`
        });
      } else {
        validations.push({
          field: 'year',
          type: 'success',
          message: 'Year is valid'
        });
      }
    }
  }

  // Sample size consistency validation
  if (fieldName === 'totalN') {
    if (fieldValue && formData) {
      const totalN = parseInt(fieldValue);
      const totalMale = parseInt(formData.totalMale || 0);
      const totalFemale = parseInt(formData.totalFemale || 0);
      
      if (!isNaN(totalN) && !isNaN(totalMale) && !isNaN(totalFemale)) {
        if (totalMale + totalFemale !== totalN) {
          validations.push({
            field: 'totalN',
            type: 'warning',
            message: `Total N (${totalN}) doesn't match sum of male (${totalMale}) + female (${totalFemale}) = ${totalMale + totalFemale}`,
            suggestion: 'Verify gender distribution or total sample size'
          });
        } else {
          validations.push({
            field: 'totalN',
            type: 'success',
            message: 'Sample size matches gender distribution'
          });
        }
      }
    }
  }

  // Mean age validation
  if (fieldName === 'meanAge') {
    if (fieldValue) {
      const age = parseFloat(fieldValue);
      if (isNaN(age) || age < 0 || age > 120) {
        validations.push({
          field: 'meanAge',
          type: 'error',
          message: 'Mean age should be between 0 and 120',
          suggestion: `Age ${fieldValue} seems unusual for a clinical study`
        });
      } else {
        validations.push({
          field: 'meanAge',
          type: 'success',
          message: 'Mean age is within valid range'
        });
      }
    }
  }

  // Standard deviation validation
  if (fieldName === 'sdAge') {
    if (fieldValue && formData.meanAge) {
      const sd = parseFloat(fieldValue);
      const mean = parseFloat(formData.meanAge);
      if (!isNaN(sd) && !isNaN(mean)) {
        if (sd < 0) {
          validations.push({
            field: 'sdAge',
            type: 'error',
            message: 'Standard deviation cannot be negative',
            suggestion: 'Check the value for standard deviation'
          });
        } else if (sd > mean) {
          validations.push({
            field: 'sdAge',
            type: 'warning',
            message: 'Standard deviation is larger than the mean, which is unusual',
            suggestion: 'Verify that the SD value is correct'
          });
        } else {
          validations.push({
            field: 'sdAge',
            type: 'success',
            message: 'Standard deviation is valid'
          });
        }
      }
    }
  }

  // Infarct volume validation
  if (fieldName === 'infarctVolume') {
    if (fieldValue) {
      const volume = parseFloat(fieldValue);
      if (isNaN(volume) || volume < 0) {
        validations.push({
          field: 'infarctVolume',
          type: 'error',
          message: 'Infarct volume must be a positive number',
          suggestion: 'Enter volume in mL or cm³'
        });
      } else if (volume > 500) {
        validations.push({
          field: 'infarctVolume',
          type: 'warning',
          message: 'Unusually large infarct volume (>500 mL)',
          suggestion: 'Verify the measurement is correct'
        });
      } else {
        validations.push({
          field: 'infarctVolume',
          type: 'success',
          message: 'Infarct volume is valid'
        });
      }
    }
  }

  return validations;
}