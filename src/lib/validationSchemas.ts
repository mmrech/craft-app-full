import { z } from 'zod';

// Study ID validation
export const studyIdSchema = z.object({
  studyId: z.string()
    .trim()
    .min(1, { message: "Study ID is required" })
    .max(100, { message: "Study ID must be less than 100 characters" }),
  title: z.string()
    .trim()
    .min(1, { message: "Title is required" })
    .max(500, { message: "Title must be less than 500 characters" }),
  authors: z.string()
    .trim()
    .min(1, { message: "Authors are required" })
    .max(1000, { message: "Authors must be less than 1000 characters" }),
  journal: z.string()
    .trim()
    .max(200, { message: "Journal name must be less than 200 characters" })
    .optional(),
  year: z.string()
    .trim()
    .regex(/^\d{4}$/, { message: "Year must be a 4-digit number" })
    .optional(),
  doi: z.string()
    .trim()
    .regex(/^10\.\d{4,}\/[^\s]+$/, { message: "Invalid DOI format (e.g., 10.1234/example)" })
    .optional()
    .or(z.literal('')),
});

// PICOT validation
export const picotSchema = z.object({
  population: z.string()
    .trim()
    .min(1, { message: "Population is required" })
    .max(1000, { message: "Population must be less than 1000 characters" }),
  intervention: z.string()
    .trim()
    .min(1, { message: "Intervention is required" })
    .max(1000, { message: "Intervention must be less than 1000 characters" }),
  comparator: z.string()
    .trim()
    .max(1000, { message: "Comparator must be less than 1000 characters" })
    .optional(),
  outcome: z.string()
    .trim()
    .min(1, { message: "Outcome is required" })
    .max(1000, { message: "Outcome must be less than 1000 characters" }),
  timing: z.string()
    .trim()
    .max(500, { message: "Timing must be less than 500 characters" })
    .optional(),
});

// Baseline characteristics validation
export const baselineSchema = z.object({
  sampleSize: z.string()
    .trim()
    .regex(/^\d+$/, { message: "Sample size must be a number" })
    .refine((val) => parseInt(val) > 0, { message: "Sample size must be greater than 0" })
    .optional()
    .or(z.literal('')),
  age: z.string()
    .trim()
    .max(200, { message: "Age must be less than 200 characters" })
    .optional(),
  gender: z.string()
    .trim()
    .max(200, { message: "Gender must be less than 200 characters" })
    .optional(),
  inclusionCriteria: z.string()
    .trim()
    .max(2000, { message: "Inclusion criteria must be less than 2000 characters" })
    .optional(),
  exclusionCriteria: z.string()
    .trim()
    .max(2000, { message: "Exclusion criteria must be less than 2000 characters" })
    .optional(),
});

// Document upload validation
export const documentUploadSchema = z.object({
  file: z.custom<File>()
    .refine((file) => file instanceof File, { message: "Please select a file" })
    .refine(
      (file) => file.size <= 50 * 1024 * 1024,
      { message: "File size must be less than 50MB" }
    )
    .refine(
      (file) => file.type === 'application/pdf',
      { message: "Only PDF files are allowed" }
    ),
});

// Generic text field validation
export const textFieldSchema = z.string()
  .trim()
  .max(5000, { message: "Text must be less than 5000 characters" });

// Number field validation
export const numberFieldSchema = z.string()
  .trim()
  .regex(/^-?\d*\.?\d+$/, { message: "Must be a valid number" })
  .optional()
  .or(z.literal(''));

// Email validation
export const emailSchema = z.string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email must be less than 255 characters" });

// Validation helper function
export function validateField<T>(schema: z.ZodSchema<T>, value: any): { 
  isValid: boolean; 
  error?: string;
  data?: T;
} {
  try {
    const data = schema.parse(value);
    return { isValid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        error: error.errors[0]?.message || 'Validation failed'
      };
    }
    return { isValid: false, error: 'Validation failed' };
  }
}
