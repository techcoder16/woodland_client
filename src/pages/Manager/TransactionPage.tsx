// src/components/TransactionPage.tsx

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// UI components (adjust imports to your paths)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

// Custom form fields
import InputField from "@/utils/InputField";
import TextAreaField from "@/utils/TextAreaField";
import SelectField from "@/utils/SelectedField"; // or wherever your SelectField is located

// Redux
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/reduxHooks";
import { fetchTransaction, upsertTransaction } from "@/redux/dataStore/transactionSlice"; 
// ^ Adjust to match your actual slice and actions

// Others
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";

/**
 * 1) Define the Zod schema for your Transaction fields
 *    The example below includes many fields from your images.
 *    Make adjustments (e.g. required vs. optional) as needed.
 */
const transactionSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),

  // Example Select field for Branch
  Branch: z.string().min(1, "Branch is required"), // or make it optional if needed

  // From Tenant Section
  fromTenantDate: z.string().optional(), // date as ISO string
  fromTenantMode: z.string().optional(),
  fromTenantOtherDebit: z.coerce.number().optional(),
  fromTenantBenefit1: z.string().optional(),
  fromTenantBenefit2: z.string().optional(),
  fromTenantRentReceived: z.coerce.number().optional(),
  fromTenantDescription: z.string().optional(),
  fromTenantReceivedBy: z.string().optional(),
  fromTenantPrivateNote: z.string().optional(),

  // Tenant Section (outside summary)
  tenantTotalCredit: z.coerce.number().optional(),
  tenantUpToDateRent: z.coerce.number().optional(),
  tenantNetOutstanding: z.coerce.number().optional(),
  tenantDueDate: z.string().optional(),

  // Gross Profit Section
  grossProfit: z.coerce.number().optional(),

  // To Landlord Section
  toLandlordDate: z.string().optional(),
  toLandlordRentReceived: z.coerce.number().optional(),
  toLandlordLeaseManagementFees: z.coerce.number().optional(),
  toLandlordLeaseBuildingExpenditure: z.coerce.number().optional(),
  toLandlordNetReceived: z.coerce.number().optional(),
  toLandlordLessVAT: z.coerce.number().optional(),
  toLandlordNetPaid: z.coerce.number().optional(),
  toLandlordChequeNo: z.string().optional(),
  toLandlordDefaultExpenditure: z.string().optional(),
  toLandlordExpenditureDescription: z.string().optional(),
  toLandlordFundBy: z.string().optional(),

  // Landlord Section (outside summary)
  landlordNetRentReceived: z.coerce.number().optional(),
  landlordNetDeductions: z.coerce.number().optional(),
  landlordNetToBePaid: z.coerce.number().optional(),
  landlordNetPaid: z.coerce.number().optional(),
  landlordNetDebit: z.coerce.number().optional(),
});

/** TypeScript type for the form data */
type TransactionFormData = z.infer<typeof transactionSchema>;

/**
 * 2) TransactionPage Component
 */
const TransactionPage: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const dispatch = useDispatch<any>();
  const { transactionData } = useAppSelector((state) => state.transaction); 
  // ^ Adjust the selector name to match your slice

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      propertyId,
      Branch: "",

      // From Tenant Section (example defaults)
      fromTenantDate: "",
      fromTenantMode: "",
      fromTenantOtherDebit: 0,
      fromTenantBenefit1: "",
      fromTenantBenefit2: "",
      fromTenantRentReceived: 0,
      fromTenantDescription: "",
      fromTenantReceivedBy: "",
      fromTenantPrivateNote: "",

      // Tenant Section
      tenantTotalCredit: 0,
      tenantUpToDateRent: 0,
      tenantNetOutstanding: 0,
      tenantDueDate: "",

      // Gross Profit
      grossProfit: 0,

      // To Landlord
      toLandlordDate: "",
      toLandlordRentReceived: 0,
      toLandlordLeaseManagementFees: 0,
      toLandlordLeaseBuildingExpenditure: 0,
      toLandlordNetReceived: 0,
      toLandlordLessVAT: 0,
      toLandlordNetPaid: 0,
      toLandlordChequeNo: "",
      toLandlordDefaultExpenditure: "",
      toLandlordExpenditureDescription: "",
      toLandlordFundBy: "",

      // Landlord Section
      landlordNetRentReceived: 0,
      landlordNetDeductions: 0,
      landlordNetToBePaid: 0,
      landlordNetPaid: 0,
      landlordNetDebit: 0,
    },
  });

  /**
   * 3) Fetch existing transaction data on mount
   */
  useEffect(() => {
    dispatch(fetchTransaction({ propertyId }));
  }, [dispatch, propertyId]);

  /**
   * 4) If we have existing data in Redux, reset the form
   */
  useEffect(() => {
    if (transactionData) {
      reset(transactionData);
    }
  }, [transactionData, reset]);

  /**
   * 5) Handle date fields with a popover + calendar
   */
  const handleDateChange = (fieldName: keyof TransactionFormData, date: Date) => {
    setValue(fieldName, date.toISOString());
  };

  /**
   * 6) Handle form submission
   */
  const onSubmit = async (data: TransactionFormData) => {
    try {
      await dispatch(upsertTransaction(data)).unwrap();
      toast.success("Transaction updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update Transaction");
    }
  };

  /**
   * 7) Handle PDF preview
   */
  const handlePreview = () => {
    const data = getValues();
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Transaction Preview", 10, 10);

    doc.setFontSize(12);
    let y = 20;

    // Example fields in the PDF
    doc.text(`Branch: ${data.Branch}`, 10, y); 
    y += 10;
    doc.text(`From Tenant Date: ${data.fromTenantDate}`, 10, y);
    y += 10;
    doc.text(`From Tenant Mode: ${data.fromTenantMode}`, 10, y);
    y += 10;
    doc.text(`Other Debit: ${data.fromTenantOtherDebit}`, 10, y);
    y += 10;
    doc.text(`Rent Received: ${data.fromTenantRentReceived}`, 10, y);
    y += 10;
    doc.text(`Description: ${data.fromTenantDescription}`, 10, y);
    y += 10;

    // ...Add more lines as needed for each field
    // For instance:
    doc.text(`Tenant Total Credit: ${data.tenantTotalCredit}`, 10, y);
    y += 10;
    doc.text(`Gross Profit: ${data.grossProfit}`, 10, y);
    y += 10;
    doc.text(`Landlord Net Rent Received: ${data.landlordNetRentReceived}`, 10, y);

    window.open(doc.output("bloburl"), "_blank");
  };

  /**
   * 8) Define example options for your SelectField
   *    Adjust to your actual branches or dynamic data.
   */
  const branchOptions = [
    { label: "London Branch", value: "london" },
    { label: "Manchester Branch", value: "manchester" },
    { label: "Birmingham Branch", value: "birmingham" },
  ];

  /**
   * 9) Render
   */
  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Transaction Page</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/** Hidden property ID */}
          <input type="hidden" {...register("propertyId")} />

          {/** Example SelectField for Branch */}
          <SelectField
            label="Branch"
            name="Branch"
            watch={watch}
            setValue={setValue}
            options={branchOptions}
            register={register}
            error={errors.Branch?.message?.toString()}
            onChange={(value: string) => {
              setValue("Branch", value);
            }}
          />

          {/** From Tenant Section */}
          <div className="flex items-center">
            <label className="mr-2 font-medium">From Tenant Date:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("mr-2 text-left font-normal", !watch("fromTenantDate") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("fromTenantDate")
                    ? new Date(watch("fromTenantDate")!).toLocaleDateString()
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("fromTenantDate") ? new Date(watch("fromTenantDate")!) : null}
                  onSelect={(date) => handleDateChange("fromTenantDate", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.fromTenantDate && (
              <p className="text-red-600 text-sm">{errors.fromTenantDate.message}</p>
            )}
          </div>

          <InputField
            label="From Tenant Mode"
            name="fromTenantMode"
            register={register}
            error={errors.fromTenantMode?.message}
            placeholder="Bank / Cash etc."
            setValue={setValue}
          />
          <InputField
            label="Other Debit"
            name="fromTenantOtherDebit"
            register={register}
            error={errors.fromTenantOtherDebit?.message}
            placeholder="Enter other debit"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Benefit 1"
            name="fromTenantBenefit1"
            register={register}
            error={errors.fromTenantBenefit1?.message}
            placeholder="Enter benefit 1"
            setValue={setValue}
          />
          <InputField
            label="Benefit 2"
            name="fromTenantBenefit2"
            register={register}
            error={errors.fromTenantBenefit2?.message}
            placeholder="Enter benefit 2"
            setValue={setValue}
          />
          <InputField
            label="Rent Received"
            name="fromTenantRentReceived"
            register={register}
            error={errors.fromTenantRentReceived?.message}
            placeholder="Enter rent received"
            type="number"
            setValue={setValue}
          />
          <TextAreaField
            label="Description"
            name="fromTenantDescription"
            register={register}
            error={errors.fromTenantDescription?.message}
            placeholder="Enter description"
          />
          <InputField
            label="Received By"
            name="fromTenantReceivedBy"
            register={register}
            error={errors.fromTenantReceivedBy?.message}
            placeholder="Name who received"
            setValue={setValue}
          />
          <TextAreaField
            label="Private Note"
            name="fromTenantPrivateNote"
            register={register}
            error={errors.fromTenantPrivateNote?.message}
            placeholder="Private note"
          />

          {/** Tenant Section (outside summary) */}
          <h3 className="font-semibold mt-4">Tenant Section</h3>
          <InputField
            label="Total Credit"
            name="tenantTotalCredit"
            register={register}
            error={errors.tenantTotalCredit?.message}
            placeholder="Enter total credit"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Up to Date Rent"
            name="tenantUpToDateRent"
            register={register}
            error={errors.tenantUpToDateRent?.message}
            placeholder="Enter up-to-date rent"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Net Outstanding"
            name="tenantNetOutstanding"
            register={register}
            error={errors.tenantNetOutstanding?.message}
            placeholder="Enter net outstanding"
            type="number"
            setValue={setValue}
          />
          <div className="flex items-center">
            <label className="mr-2 font-medium">Due Date:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("mr-2 text-left font-normal", !watch("tenantDueDate") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("tenantDueDate")
                    ? new Date(watch("tenantDueDate")!).toLocaleDateString()
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("tenantDueDate") ? new Date(watch("tenantDueDate")!) : null}
                  onSelect={(date) => handleDateChange("tenantDueDate", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.tenantDueDate && (
              <p className="text-red-600 text-sm">{errors.tenantDueDate.message}</p>
            )}
          </div>

          {/** Gross Profit */}
          <h3 className="font-semibold mt-4">Gross Profit Section</h3>
          <InputField
            label="Gross Profit"
            name="grossProfit"
            register={register}
            error={errors.grossProfit?.message}
            placeholder="Enter gross profit"
            type="number"
            setValue={setValue}
          />

          {/** To Landlord Section */}
          <h3 className="font-semibold mt-4">To Landlord Section</h3>
          <div className="flex items-center">
            <label className="mr-2 font-medium">Date:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("mr-2 text-left font-normal", !watch("toLandlordDate") && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("toLandlordDate")
                    ? new Date(watch("toLandlordDate")!).toLocaleDateString()
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("toLandlordDate") ? new Date(watch("toLandlordDate")!) : null}
                  onSelect={(date) => handleDateChange("toLandlordDate", date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.toLandlordDate && (
              <p className="text-red-600 text-sm">{errors.toLandlordDate.message}</p>
            )}
          </div>
          <InputField
            label="Rent Received"
            name="toLandlordRentReceived"
            register={register}
            error={errors.toLandlordRentReceived?.message}
            placeholder="Enter rent received"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Lease Management Fees"
            name="toLandlordLeaseManagementFees"
            register={register}
            error={errors.toLandlordLeaseManagementFees?.message}
            placeholder="Enter lease management fees"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Lease Building Expenditure"
            name="toLandlordLeaseBuildingExpenditure"
            register={register}
            error={errors.toLandlordLeaseBuildingExpenditure?.message}
            placeholder="Enter building expenditure"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Net Received"
            name="toLandlordNetReceived"
            register={register}
            error={errors.toLandlordNetReceived?.message}
            placeholder="Enter net received"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Less VAT"
            name="toLandlordLessVAT"
            register={register}
            error={errors.toLandlordLessVAT?.message}
            placeholder="Enter VAT"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Net Paid"
            name="toLandlordNetPaid"
            register={register}
            error={errors.toLandlordNetPaid?.message}
            placeholder="Enter net paid"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Cheque No."
            name="toLandlordChequeNo"
            register={register}
            error={errors.toLandlordChequeNo?.message}
            placeholder="Enter cheque no."
            setValue={setValue}
          />
          <InputField
            label="Default Expenditure"
            name="toLandlordDefaultExpenditure"
            register={register}
            error={errors.toLandlordDefaultExpenditure?.message}
            placeholder="Enter default expenditure"
            setValue={setValue}
          />
          <TextAreaField
            label="Expenditure Description"
            name="toLandlordExpenditureDescription"
            register={register}
            error={errors.toLandlordExpenditureDescription?.message}
            placeholder="Enter expenditure description"
          />
          <InputField
            label="Fund By"
            name="toLandlordFundBy"
            register={register}
            error={errors.toLandlordFundBy?.message}
            placeholder="Enter funding source"
            setValue={setValue}
          />

          {/** Landlord Section (outside summary) */}
          <h3 className="font-semibold mt-4">Landlord Section</h3>
          <InputField
            label="Net Rent Received"
            name="landlordNetRentReceived"
            register={register}
            error={errors.landlordNetRentReceived?.message}
            placeholder="Enter net rent received"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Net Deductions"
            name="landlordNetDeductions"
            register={register}
            error={errors.landlordNetDeductions?.message}
            placeholder="Enter net deductions"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Net to be Paid"
            name="landlordNetToBePaid"
            register={register}
            error={errors.landlordNetToBePaid?.message}
            placeholder="Enter net to be paid"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Net Paid"
            name="landlordNetPaid"
            register={register}
            error={errors.landlordNetPaid?.message}
            placeholder="Enter net paid"
            type="number"
            setValue={setValue}
          />
          <InputField
            label="Net Debit"
            name="landlordNetDebit"
            register={register}
            error={errors.landlordNetDebit?.message}
            placeholder="Enter net debit"
            type="number"
            setValue={setValue}
          />

          {/** Action buttons */}
          <div className="flex justify-end space-x-4 mt-4">
            <Button type="button" onClick={handlePreview}>
              Preview Transaction
            </Button>
            <Button type="submit">Update Transaction</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionPage;
