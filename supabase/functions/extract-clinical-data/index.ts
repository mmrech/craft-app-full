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
    const { pdfText, extractionType, currentData, pageImages } = await req.json();
    
    if (!pdfText) {
      throw new Error("PDF text is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${extractionType} extraction with ${pageImages?.length || 0} page images`);

    const systemPrompt = getSystemPrompt(extractionType);
    const tools = getExtractionTools(extractionType);

    // Enhanced prompt for vision processing
    const enhancedPrompt = systemPrompt + 
      "\n\nIMPORTANT: For each extracted field, return:\n" +
      "1. value: The actual data extracted\n" +
      "2. boundingBox: normalized coordinates [ymin, xmin, ymax, xmax] where the data appears\n" +
      "3. pageNumber: which page contains this data (1-indexed)\n" +
      "Return null for boundingBox and pageNumber if you cannot locate the exact position.";

    // Build user message content with text and images
    const userContent: any[] = [
      { type: "text", text: `Extract clinical data from this document:\n\n${pdfText}` }
    ];

    // Add page images for vision processing
    if (pageImages && pageImages.length > 0) {
      pageImages.forEach((img: any) => {
        userContent.push({
          type: "image_url",
          image_url: { url: img.imageBase64 }
        });
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: enhancedPrompt },
          { role: "user", content: userContent }
        ],
        tools,
        tool_choice: { type: "function", function: { name: tools[0].function.name } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI extraction failed");
    }

    const data = await response.json();
    console.log("AI response received");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No extraction data returned from AI");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: extractedData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extraction error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getSystemPrompt(extractionType: string): string {
  const prompts: Record<string, string> = {
    study_id: `You are a clinical research data extraction specialist. Extract study identification information from the provided text. Be precise and extract only what is clearly stated. For each field, provide a confidence score (0-1).`,
    
    picot: `You are a clinical research data extraction specialist. Extract PICOT elements (Population, Intervention, Comparator, Outcome, Timing) from the provided text. Be thorough but only extract explicitly mentioned information.`,
    
    baseline: `You are a clinical research data extraction specialist. Extract baseline characteristics and demographics from the provided text. Include sample size, age, gender distribution, and inclusion/exclusion criteria.`,
    
    imaging: `You are a clinical data extraction assistant. Extract imaging-related data from cerebellar stroke research articles. Focus on vascular territory, infarct volumes, edema dynamics, and involvement areas.`,
    
    interventions: `You are a clinical data extraction assistant. Extract surgical intervention data from cerebellar stroke research articles. Focus on surgical indications, intervention types, timing, and procedures.`,
    
    study_arms: `You are a clinical data extraction assistant. Extract study arm/group definitions from the research article. Focus on identifying comparison groups, their labels, and sample sizes.`,
    
    outcomes: `You are a clinical data extraction assistant. Extract outcome data including mortality and Modified Rankin Scale (mRS) scores from the research article. Focus on timepoints, arms, and specific measurements.`,
    
    complications: `You are a clinical data extraction assistant. Extract complication and predictor data from the research article. Focus on adverse events, predictors of outcome, and statistical associations.`,
    
    full_study: `You are a clinical research data extraction specialist. Extract all major clinical study information including study ID, PICOT elements, baseline characteristics, interventions, and outcomes. Provide comprehensive extraction with confidence scores.`
  };

  return prompts[extractionType] || prompts.full_study;
}

function getExtractionTools(extractionType: string) {
  // Shared field schemas for vision-enabled extraction
  const fieldSchema = {
    type: "object",
    properties: {
      value: { type: "string" },
      boundingBox: { 
        type: "array", 
        items: { type: "number" }, 
        minItems: 4, 
        maxItems: 4,
        description: "Normalized [ymin, xmin, ymax, xmax]"
      },
      pageNumber: { type: "integer", description: "Page number (1-indexed)" }
    },
    required: ["value"]
  };

  const numFieldSchema = {
    type: "object",
    properties: {
      value: { type: "number" },
      boundingBox: { 
        type: "array", 
        items: { type: "number" }, 
        minItems: 4, 
        maxItems: 4 
      },
      pageNumber: { type: "integer" }
    },
    required: ["value"]
  };

  const tools: Record<string, any> = {
    study_id: [{
      type: "function",
      function: {
        name: "extract_study_id",
        description: "Extract study identification information with location data",
        parameters: {
          type: "object",
          properties: {
            citation: fieldSchema,
            doi: fieldSchema,
            pmid: fieldSchema,
            journal: fieldSchema,
            year: fieldSchema,
            country: fieldSchema,
            centers: fieldSchema,
            funding: fieldSchema,
            conflicts: fieldSchema,
            registration: fieldSchema
          },
          required: ["citation"],
          additionalProperties: false
        }
      }
    }],
    
    picot: [{
      type: "function",
      function: {
        name: "extract_picot",
        description: "Extract PICOT elements with location data",
        parameters: {
          type: "object",
          properties: {
            "eligibility-population": fieldSchema,
            "eligibility-intervention": fieldSchema,
            "eligibility-comparator": fieldSchema,
            "eligibility-outcomes": fieldSchema,
            "eligibility-timing": fieldSchema,
            "eligibility-studyType": fieldSchema
          },
          required: ["eligibility-population", "eligibility-intervention", "eligibility-outcomes"],
          additionalProperties: false
        }
      }
    }],
    
    baseline: [{
      type: "function",
      function: {
        name: "extract_baseline",
        description: "Extract baseline characteristics with location data",
        parameters: {
          type: "object",
          properties: {
            totalN: fieldSchema,
            surgicalN: fieldSchema,
            controlN: fieldSchema,
            meanAge: fieldSchema,
            sdAge: fieldSchema,
            totalMale: fieldSchema,
            totalFemale: fieldSchema,
            prestrokeMRS: fieldSchema,
            nihssMean: fieldSchema,
            gcsMean: fieldSchema
          },
          additionalProperties: false
        }
      }
    }],
    
    imaging: [{
      type: "function",
      function: {
        name: "extract_imaging_data",
        description: "Extract imaging characteristics with location data",
        parameters: {
          type: "object",
          properties: {
            vascularTerritory: fieldSchema,
            infarctVolume: numFieldSchema,
            strokeVolumeCerebellum: fieldSchema,
            edemaDynamics: fieldSchema,
            peakSwellingWindow: fieldSchema,
            brainstemInvolvement: fieldSchema,
            supratentorialInvolvement: fieldSchema,
            nonCerebellarStroke: fieldSchema
          },
          additionalProperties: false
        }
      }
    }],
    
    interventions: [{
      type: "function",
      function: {
        name: "extract_intervention_data",
        description: "Extract surgical intervention data",
        parameters: {
          type: "object",
          properties: {
            indications: {
              type: "array",
              description: "Surgical indications",
              items: {
                type: "object",
                properties: {
                  sign: { type: "string", description: "Sign/symptom" },
                  count: { type: "number", description: "Patient count" }
                }
              }
            },
            interventions: {
              type: "array",
              description: "Interventions performed",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", description: "Intervention type" },
                  timeToSurgery: { type: "number", description: "Hours to surgery" },
                  duraplasty: { type: "string", description: "Duraplasty (true/false/null)" }
                }
              }
            },
            confidence: {
              type: "object",
              properties: {
                indications: { type: "number" },
                interventions: { type: "number" }
              }
            }
          },
          additionalProperties: false
        }
      }
    }],
    
    study_arms: [{
      type: "function",
      function: {
        name: "extract_study_arms",
        description: "Extract study arm definitions",
        parameters: {
          type: "object",
          properties: {
            arms: {
              type: "array",
              description: "Study arms/groups",
              items: {
                type: "object",
                properties: {
                  label: { type: "string", description: "Arm label" },
                  sampleSize: { type: "number", description: "Patients in arm" }
                },
                required: ["label", "sampleSize"]
              }
            },
            confidence: {
              type: "object",
              properties: {
                arms: { type: "number" }
              }
            }
          },
          required: ["arms"],
          additionalProperties: false
        }
      }
    }],
    
    outcomes: [{
      type: "function",
      function: {
        name: "extract_outcome_data",
        description: "Extract mortality and mRS data",
        parameters: {
          type: "object",
          properties: {
            mortality: {
              type: "array",
              description: "Mortality data points",
              items: {
                type: "object",
                properties: {
                  arm: { type: "string", description: "Study arm" },
                  timepoint: { type: "string", description: "Timepoint" },
                  deaths: { type: "number", description: "Number of deaths" },
                  total: { type: "number", description: "Total patients" }
                }
              }
            },
            mrsData: {
              type: "array",
              description: "mRS data points",
              items: {
                type: "object",
                properties: {
                  arm: { type: "string", description: "Study arm" },
                  timepoint: { type: "string", description: "Timepoint" },
                  score0: { type: "number", description: "mRS 0 count" },
                  score1: { type: "number", description: "mRS 1 count" },
                  score2: { type: "number", description: "mRS 2 count" },
                  score3: { type: "number", description: "mRS 3 count" },
                  score4: { type: "number", description: "mRS 4 count" },
                  score5: { type: "number", description: "mRS 5 count" },
                  score6: { type: "number", description: "mRS 6 count" }
                }
              }
            },
            confidence: {
              type: "object",
              properties: {
                mortality: { type: "number" },
                mrsData: { type: "number" }
              }
            }
          },
          additionalProperties: false
        }
      }
    }],
    
    complications: [{
      type: "function",
      function: {
        name: "extract_complication_data",
        description: "Extract complications and predictors",
        parameters: {
          type: "object",
          properties: {
            complications: {
              type: "array",
              description: "Complications list",
              items: {
                type: "object",
                properties: {
                  description: { type: "string", description: "Complication description" },
                  arm: { type: "string", description: "Study arm" },
                  count: { type: "number", description: "Patient count" }
                }
              }
            },
            predictorsPoorOutcomeSurgical: { type: "string", description: "Predictors summary" },
            predictors: {
              type: "array",
              description: "Predictor analysis",
              items: {
                type: "object",
                properties: {
                  variable: { type: "string", description: "Predictor variable" },
                  effectSize: { type: "number", description: "Effect size (OR/HR)" },
                  ciLower: { type: "number", description: "95% CI lower" },
                  ciUpper: { type: "number", description: "95% CI upper" },
                  pValue: { type: "number", description: "p-value" }
                }
              }
            },
            confidence: {
              type: "object",
              properties: {
                complications: { type: "number" },
                predictors: { type: "number" }
              }
            }
          },
          additionalProperties: false
        }
      }
    }]
  };

  return tools[extractionType] || tools.study_id;
}