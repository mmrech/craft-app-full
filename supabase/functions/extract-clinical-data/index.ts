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
    const { pdfText, extractionType, currentData } = await req.json();
    
    if (!pdfText) {
      throw new Error("PDF text is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${extractionType} extraction request`);

    const systemPrompt = getSystemPrompt(extractionType);
    const tools = getExtractionTools(extractionType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract clinical data from this text:\n\n${pdfText}` }
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
    
    full_study: `You are a clinical research data extraction specialist. Extract all major clinical study information including study ID, PICOT elements, baseline characteristics, interventions, and outcomes. Provide comprehensive extraction with confidence scores.`
  };

  return prompts[extractionType] || prompts.full_study;
}

function getExtractionTools(extractionType: string) {
  const tools: Record<string, any> = {
    study_id: [{
      type: "function",
      function: {
        name: "extract_study_id",
        description: "Extract study identification information",
        parameters: {
          type: "object",
          properties: {
            citation: {
              type: "string",
              description: "Full citation of the study"
            },
            doi: {
              type: "string",
              description: "Digital Object Identifier (DOI)"
            },
            pmid: {
              type: "string",
              description: "PubMed ID"
            },
            journal: {
              type: "string",
              description: "Journal name"
            },
            year: {
              type: "string",
              description: "Publication year"
            },
            country: {
              type: "string",
              description: "Country of the study"
            },
            centers: {
              type: "string",
              description: "Single or multi-center study"
            },
            funding: {
              type: "string",
              description: "Funding sources"
            },
            conflicts: {
              type: "string",
              description: "Conflicts of interest"
            },
            registration: {
              type: "string",
              description: "Trial registration ID"
            },
            confidence: {
              type: "object",
              description: "Confidence scores for each field (0-1)",
              properties: {
                citation: { type: "number" },
                doi: { type: "number" },
                journal: { type: "number" }
              }
            }
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
        description: "Extract PICOT elements from clinical study",
        parameters: {
          type: "object",
          properties: {
            population: {
              type: "string",
              description: "Study population description"
            },
            intervention: {
              type: "string",
              description: "Intervention or exposure"
            },
            comparator: {
              type: "string",
              description: "Comparator or control"
            },
            outcome: {
              type: "string",
              description: "Primary and secondary outcomes"
            },
            timing: {
              type: "string",
              description: "Study duration and follow-up"
            },
            confidence: {
              type: "object",
              properties: {
                population: { type: "number" },
                intervention: { type: "number" },
                outcome: { type: "number" }
              }
            }
          },
          required: ["population", "intervention", "outcome"],
          additionalProperties: false
        }
      }
    }],
    
    baseline: [{
      type: "function",
      function: {
        name: "extract_baseline",
        description: "Extract baseline characteristics",
        parameters: {
          type: "object",
          properties: {
            sampleSize: {
              type: "string",
              description: "Total sample size"
            },
            age: {
              type: "string",
              description: "Age range or mean age"
            },
            gender: {
              type: "string",
              description: "Gender distribution"
            },
            inclusionCriteria: {
              type: "string",
              description: "Inclusion criteria"
            },
            exclusionCriteria: {
              type: "string",
              description: "Exclusion criteria"
            },
            confidence: {
              type: "object",
              properties: {
                sampleSize: { type: "number" },
                age: { type: "number" }
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
