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
});
