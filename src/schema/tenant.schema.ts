import { z } from "zod";

export const tenantSchema = z.object({
  id: z.string().optional(),
  title: z.string().nullable(),
  FirstName: z.string().nullable(),
  SureName: z.string().nullable(),
  MobileNo: z.string().nullable(),
  HomePhone: z.string().nullable(),
  WorkPhone: z.string().nullable(),
  Email: z.string().email().nullable(),
  EmployeeName: z.string().nullable(),
  BankAccountNo: z.string().nullable(),
  SortCode: z.string().nullable(),
  BankName: z.string().nullable(),
  IDCheck: z.string().nullable(),
  Address: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  town: z.string().nullable(),
  postCode: z.string().nullable(),
  country: z.string().nullable(),
});
