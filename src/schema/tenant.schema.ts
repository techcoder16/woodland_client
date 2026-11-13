import { z } from "zod";

// Every field here is optional in the UI. react-hook-form leaves an
// untouched/blank field as undefined (not null), and a text input that's
// cleared reports "" — so each field must accept undefined and "" as well
// as null, or handleSubmit() silently refuses to call onSubmit at all
// (no error shown, no network call — looks exactly like a dead button).
const optionalText = z.string().optional().nullable();

export const tenantSchema = z.object({
  id: z.string().optional(),
  title: optionalText,
  FirstName: optionalText,
  SureName: optionalText,
  MobileNo: optionalText,
  HomePhone: optionalText,
  WorkPhone: optionalText,
  Email: z
    .union([z.literal(""), z.string().email()])
    .optional()
    .nullable(),
  // Additional emails, ", " separated — each one must be a valid address.
  Email2: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || v.split(",").map((e) => e.trim()).filter(Boolean).every((e) => z.string().email().safeParse(e).success),
      { message: "Enter valid email addresses" },
    ),
  EmployeeName: optionalText,
  BankAccountNo: optionalText,
  SortCode: optionalText,
  BankName: optionalText,
  IDCheck: optionalText,
  Address: optionalText,
  addressLine1: optionalText,
  addressLine2: optionalText,
  town: optionalText,
  postCode: optionalText,
  country: optionalText,
}).refine(
  (t) => [t.MobileNo, t.HomePhone, t.Email, t.Email2].some((v) => (v || "").trim() !== ""),
  { message: "Enter at least one contact number or email", path: ["MobileNo"] },
);
