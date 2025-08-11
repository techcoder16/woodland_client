// src/components/Rent.tsx
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/utils/InputField";
import TextAreaField from "@/utils/TextAreaField";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash } from "lucide-react";
import { useDispatch } from "react-redux";
import { upsertRent, fetchRents } from "@/redux/dataStore/rentSlice";
import { useAppSelector } from "@/redux/reduxHooks";
import SelectField from "@/utils/SelectedField";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,

} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

import InputSelect from "@/utils/InputSelect";
import { TableCell } from "@/components/ui/table";

// ----- Zod Schemas ----- //

// Extend the deposit schema with a new computed field "bill"
const depositSchema = z.object({
  description: z.string().min(1, "Description is required"),
  rent: z.coerce.number({ invalid_type_error: "Deposit rent must be a number" }),
  per: z.enum(["day","week","2-week","4-week","calender-month"], {
    errorMap: () => ({ message: "Select a valid period" }),
  }),
  startsOn: z.string().min(1, "Start date is required"),
  closedOn: z.string().min(1, "Closed date is required"),
  month: z.enum(
    ["6","12","24","36","48","60"],
    { errorMap: () => ({ message: "Select a valid month" }) }
  ),
  inArrears: z.boolean().optional(),
  expiryDate: z.string().min(1, "Expiry date is required"),
  bill: z.coerce.number({ invalid_type_error: "Bill must be a number" }),
});

// Main Rent form schema with Deposit as an array
const rentSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  Amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }),
  ReceivedOn: z.string().min(1, "Received On is required"),
  HoldBy: z.string().min(1, "HoldBy is required"),
  ReturnedOn: z.string().optional(),
  DateOfAgreement: z.string().min(1, "Date Of Agreement is required"),
  Deposit: z.array(depositSchema),
  NoOfOccupant: z.coerce.number({ invalid_type_error: "Number of occupants must be a number" }),
  DssRef: z.string().min(1, "DSS Ref is required"),
  HowFurnished: z.string().min(1, "How Furnished is required"),
  Note: z.string().optional(),
  fees:z.string().optional(),
  closed:z.boolean().optional(),
  oldRef:z.string().optional(),
  
});

type RentFormData = z.infer<typeof rentSchema>;

// Options for the Deposit "Per" select field
const perOptions = [ 
  {label :"Day",value:"day"},
  {label :"Week",value:"week"},
  {label :"2 Week",value:"2-week"},
  {label :"4 Week",value:"4-week"},
  { label: "Calender-Month", value: "calender-month" },
];

 const feeOptions = [
    { label: "%", value: "%" },
    { label: "Fixed", value: "fixed" },
  ];


// Options for the Month dropdown (1 to 12)
const monthValues = [6, 12, 24, 36, 48, 60];
const monthOptions = monthValues.map((m) => ({
  label: m.toString(),
  value: m.toString(),
}));

// Utility to calculate the bill using closedOn date, period type, and inArrears flag.
const calculateBill = (
  rent: number,
  startsOn: string,
  closedOn: string,
  per: string,
  inArrears: boolean = false
): number => {
  if (!startsOn || !closedOn || isNaN(Date.parse(startsOn)) || isNaN(Date.parse(closedOn))) {
    return rent;
  }

  const start = new Date(startsOn);
  const end = new Date(closedOn);
  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  let periods = 1;

  switch (per.toLowerCase()) {
    case "day":
      periods = diffInDays;
      break;
    case "week":
      periods = Math.ceil(diffInDays / 7);
      break;
    case "2-week":
      periods = Math.ceil(diffInDays / 14);
      break;
    case "4-week":
      periods = Math.ceil(diffInDays / 28);
      break;
    case "calendar-month":
    case "calender-month":
      periods =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        (end.getDate() >= start.getDate() ? 0 : -1);
      break;
    default:
      periods = 1;
      break;
  }

  // Ensure at least one period is billed
  periods = Math.max(1, periods);

  // Apply in-arrears logic
  if (inArrears) {
    periods = Math.max(0, periods - 1);
  }

  return rent * periods;
};

// Custom Date Field Component for consistent styling
export const DateField = ({ 
  label, 
  value, 
  onChange, 
  error, 
  placeholder = "Pick a date" 
}: {
  label: string;
  value: string;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? new Date(value).toLocaleDateString() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => date && onChange(date)}
          initialFocus
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

// ----- Rent Component ----- //
interface RentComponentProps {
  propertyId: string;
  property:any;
}

const Rent: React.FC<RentComponentProps> = ({ propertyId ,property}) => {
  const dispatch = useDispatch<any>();
  const { rents } = useAppSelector((state) => state.rent);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<RentFormData>({
    resolver: zodResolver(rentSchema),
    defaultValues: { propertyId, Deposit: [] },
  });

  const handleSelectChange = (name: keyof RentFormData, value: string) => {
    setValue(name, value);
    clearErrors(name);
  };

   useEffect(() => {
    if (rents && Object.keys(rents).length > 0) {
      console.log(rents);
      console.log(rents.fees,typeof(rents));
      
      const split_fee = rents?.fees?.split("-")
      console.log(split_fee)
      let rentsCopy = { ...rents };
const [fees_input, fees_select] = (rentsCopy.fees || "").split("-");
rentsCopy.fees_input = fees_input || "";
rentsCopy.fees_select = fees_select || "";


      reset(rentsCopy && rentsCopy);
    }
  }, [rents, reset]);


  // useFieldArray for deposits
  const { fields: depositFields, append, remove } = useFieldArray({
    control,
    name: "Deposit",
  });

  // Fetch rents on mount
  useEffect(() => {
    dispatch(fetchRents({ propertyId, page: 1, search: "" }));
  }, [dispatch, propertyId]);

  // Generic calendar handler
  const handleDateChange = (name: any, date: Date) => {
    setValue(name, date.toISOString());
  };

  const onSubmit = async (data: RentFormData) => {
    try {
      await dispatch(upsertRent(data)).unwrap();
      toast.success("Rent updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to Update Rent");
    }
  };

  // Deposit Modal local form state (separate from main form)
  const {
    register: depositRegister,
    handleSubmit: handleDepositSubmit,
    setValue: setDepositValue,
    watch: depositWatch,
    reset: resetDepositForm,
    formState: { errors: depositErrors },
  } = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      description: "",
      rent: 0,
      per: "calender-month",
      month: "6",
      startsOn: "",
      closedOn: "",
      expiryDate: "",
      bill: 0,
      inArrears: false
    },
  });

  // Handler for deposit modal submission
  const onDepositSubmit = (depositData: z.infer<typeof depositSchema>) => {
    const computedBill = calculateBill(
      depositData.rent,
      depositData.startsOn,
      depositData.closedOn,
      depositData.per,
      depositData.inArrears
    );
    append({ ...depositData, bill: computedBill });
    toast.success("Deposit added!");
    resetDepositForm();
    setIsDepositModalOpen(false);
  };

  const startsOn = depositWatch("startsOn");
  const months = depositWatch("month");

  useEffect(() => {
    if (startsOn && months) {
      const startDate = new Date(startsOn);
      const newExpiry = new Date(startDate.setMonth(startDate.getMonth() + Number(months)));
      const formatted = newExpiry.toISOString().split("T")[0];
      setDepositValue("expiryDate", formatted);
    }
  }, [startsOn, months]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Main Rent Form */}
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl font-semibold">Rent Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* First Row - Amount, Received On, Held By */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label="Amount (£)"
                name="Amount"
                register={register}
                error={errors.Amount?.message}
                placeholder="Enter rent amount"
                type="number"
                setValue={setValue}
              />
              
              <DateField
                label="Received On"
                value={watch("ReceivedOn")}
                onChange={(date) => handleDateChange("ReceivedOn", date)}
                error={errors.ReceivedOn?.message}
              />
              
              <SelectField
                label="Held By"
                name="HoldBy"
                register={register}
                error={errors.HoldBy?.message}
                watch={watch}
                options={[
                  { value: "landlord", label: "The Landlord" },
                  { value: "agent", label: "Letting Agent" },
                  { value: "The-Dispute-Service-Ltd", label: "The Dispute Service Ltd" },
                  { value: "The-Deposit-Protection-Service", label: "The Deposit Protection Service" },
                  { value: "Tenancy-Deposit-Solutions-Limited", label: "Tenancy Deposit Solutions Limited" }
                ]}
                setValue={setValue}
                onChange={(value) => { handleSelectChange("HoldBy", value) }}
              />
            </div>

            {/* Second Row - Returned On, Date of Agreement, No. of Occupants */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DateField
                label="Returned On"
                value={watch("ReturnedOn") || ""}
                onChange={(date) => handleDateChange("ReturnedOn", date)}
                error={errors.ReturnedOn?.message}
                placeholder="Pick return date (optional)"
              />
              
              <DateField
                label="Date of Agreement"
                value={watch("DateOfAgreement")}
                onChange={(date) => handleDateChange("DateOfAgreement", date)}
                error={errors.DateOfAgreement?.message}
              />
              
              <InputField
                label="No. of Occupants"
                name="NoOfOccupant"
                register={register}
                error={errors.NoOfOccupant?.message}
                placeholder="Enter number of occupants"
                type="number"
                setValue={setValue}
              />
            </div>

            {/* Third Row - DSS Ref, How Furnished, Note */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label="DSS Ref (If Any)"
                name="DssRef"
                register={register}
                error={errors.DssRef?.message}
                placeholder="Enter DSS reference"
                setValue={setValue}
                             />
              
              <SelectField
                label="How Furnished"
                name="HowFurnished"
                register={register}
                error={errors.HowFurnished?.message}
                watch={watch}
                options={[
                  { value: "Partially-Furnished", label: "Partially Furnished" },
                  { value: "Fully-Furnished", label: "Fully Furnished" },
                  { value: "Un-Furnished", label: "Unfurnished" }
                ]}
                setValue={setValue}
                      onChange={(value)=>{handleSelectChange("HowFurnished",value)}}

              />



              
              <TextAreaField
                label="Note"
                name="Note"
                register={register}
                error={errors.Note?.message}
                placeholder="Enter note (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <InputSelect
          setValue={setValue}

          label="Management Fees"
          name="fees"
          watch={watch}

          options={feeOptions}
          register={register}
        />


    <InputField
                label="Old Ref"
                name="oldRef"
                register={register}
                error={errors.NoOfOccupant?.message}
                placeholder=""
                type="text"
                setValue={setValue}
              />


              
            <InputField
              label="Closed?"
              name="closed"
              type="checkbox"
              register={register}
              error={errors.closed?.message}
              setValue={setValue}
            />


                </div>
            {/* Deposits Section */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Deposits</h3>
                <Button 
                  type="button" 
                  onClick={() => setIsDepositModalOpen(true)}
                  className=""
                >
                  Add Deposit
                </Button>
              </div>
              
           {depositFields.length > 0 && (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Rent / Bill</TableHead>
          <TableHead>Period / Duration</TableHead>
          <TableHead>Start - End</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {depositFields.map((field, index) => (
          <TableRow key={field.id}>
            <TableCell className="font-medium">{field.description}</TableCell>
            <TableCell>£{field.rent} / £{field.bill}</TableCell>
            <TableCell>{field.per} / {field.month} months</TableCell>
            <TableCell>
              {new Date(field.startsOn).toLocaleDateString()} -{" "}
              {new Date(field.closedOn).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button 
                type="button"
                variant="destructive" 
                size="sm"
                onClick={() => remove(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)}

            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <Button 
                type="submit" 
                className="w-full md:w-auto px-8 py-2"
              >
                Update Rent Information
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Deposit Modal */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold mb-4">Add New Deposit</DialogTitle>
          
          <form onSubmit={handleDepositSubmit(onDepositSubmit)} className="space-y-6">
            {/* First Row - Description, Rent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Description"
                name="description"
                register={depositRegister}
                error={depositErrors.description?.message}
                placeholder="Enter description"
                setValue={setDepositValue}
              />
              
              <InputField
                label="Rent (£)"
                name="rent"
                register={depositRegister}
                error={depositErrors.rent?.message}
                placeholder="Enter deposit rent"
                type="number"
                setValue={setDepositValue}
              />
            </div>

            {/* Second Row - Per, Months */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                label="Billing Period"
                name="per"
                options={perOptions}
                register={depositRegister}
                onChange={(value: any) => setDepositValue("per", value)}
                error={depositErrors.per?.message?.toString()}
                watch={depositWatch}
                setValue={setDepositValue}
              />
              
              <SelectField
                label="Duration (Months)"
                name="month"
                options={monthOptions}
                register={depositRegister}
                onChange={(value: any) => setDepositValue("month", value)}
                error={depositErrors.month?.message?.toString()}
                watch={depositWatch}
                setValue={setDepositValue}
              />
            </div>

            {/* Third Row - Starts On, Closed On */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DateField
                label="Starts On"
                value={depositWatch("startsOn")}
                onChange={(date) => setDepositValue("startsOn", date.toISOString())}
                error={depositErrors.startsOn?.message}
              />
              
              <DateField
                label="Closed On"
                value={depositWatch("closedOn")}
                onChange={(date) => setDepositValue("closedOn", date.toISOString())}
                error={depositErrors.closedOn?.message}
              />
            </div>

            {/* Fourth Row - Expiry Date, In Arrears */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DateField
                label="Expiry Date"
                value={depositWatch("expiryDate")}
                onChange={(date) => setDepositValue("expiryDate", date.toISOString())}
                error={depositErrors.expiryDate?.message}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                <div className="flex items-center space-x-3 h-10">
                  <input
                    type="checkbox"
                    {...depositRegister("inArrears")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">In Arrears</span>
                </div>
                {depositErrors.inArrears && (
                  <p className="text-sm text-red-600">{depositErrors.inArrears.message}</p>
                )}
              </div>
            </div>

            {/* Bill Calculation Display */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Calculated Bill (£)</label>
              <input
                type="number"
                readOnly
                value={calculateBill(
                  Number(depositWatch("rent")),
                  depositWatch("startsOn"),
                  depositWatch("closedOn"),
                  depositWatch("per"),
                  depositWatch("inArrears")
                )}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-medium"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDepositModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className=""
              >
                Add Deposit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rent;