import { z } from "zod";

const roomSchema = z.object({
  name: z.string().optional(),
  length: z.union([z.string(), z.number()]).optional(),
  width: z.union([z.string(), z.number()]).optional(),
});

  


export const propertySchema =
z.object({

  for: z.string().nullable().default(null).describe("For field is required."),
  category: z.string().nullable().default(null).describe("Category is required."),
  propertyTypeCategory: z.string().nullable().default(null).describe("Property type category is required."),
  bedrooms: z.union([z.string(), z.number()]).nullable().default(null).describe("Number of bedrooms."),
  bathrooms: z.union([z.string(), z.number()]).nullable().default(null).describe("Number of bathrooms."),
  receptions: z.union([z.string(), z.number()]).nullable().default(null).describe("Number of receptions."),
  floorNumber: z.union([z.string(), z.number()]).nullable().default(null).describe("Floor number."),
  wheelchairAccess: z.boolean().nullable().default(false).describe("Wheelchair access."),
  hasGarden: z.boolean().nullable().default(false).describe("Garden."),
  lift: z.boolean().nullable().default(false).describe("Lift."),
  gas: z.boolean().nullable().default(false).describe("Gas."),
  price: z.string().nullable().default(null).describe("Price is required."),
  postCode: z.string().nullable().default(null).describe("Postcode is required."),
  propertyNo: z.string().nullable().default(null).describe("Property number is required."),

  addressLine1: z.string({ required_error: "Address Line 1 is required." }).min(1, "Address Line 1 cannot be empty."),
  addressLine2: z.string().nullable().default(null).describe("Address Line 2 is required."),
  town: z.string().nullable().default(null).describe("Town is required."),
  country: z.string().nullable().default(null).transform(val => val ?? "").pipe(z.string().min(1, "Country is required.")),

  photographs: z.string()
    .regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid image files in Base64 format are allowed.",
    })
    .or(z.literal(""))
    .nullable().optional(),
  floorPlans: z.string()
    .regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid floor plan images in Base64 format are allowed.",
    })
    .or(z.literal(""))
    .nullable().optional(),

  epcCertificate: z.any().nullable().optional(),
  gasCertificate: z.any().nullable().optional(),
  electricityCertificate: z.any().nullable().optional(),
  fireRiskAssessment: z.any().nullable().optional(),
  insuranceCertificate: z.any().nullable().optional(),
  emergencyLightingCertificate: z.any().nullable().optional(),
  propertyLicense: z.any().nullable().optional(),
  rentEffectiveDate: z.string().nullable().optional(),
  rentPerMonth: z.string().nullable().optional(),
  rentPayableInAdvance: z.string().nullable().optional(),
  rentalTerms: z.string().nullable().optional(),

  status: z.string().nullable().default(null).describe("Status is required."),
  vendor: z.string().nullable().default(null).refine((val) => !!val, { message: "Landlord is required." }),
  rooms: z.array(roomSchema).optional(),
  attachments: z.array(
    z.string()
      .regex(/^data:image\/[a-zA-Z+]+;base64,/, {
        message: "Only valid image files in Base64 format are allowed.",
      })
      .or(z.literal(""))
  ).optional().default([]),
  propertyStatus: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT").optional(),
});

