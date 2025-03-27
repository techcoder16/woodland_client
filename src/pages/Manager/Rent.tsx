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
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

// ----- Zod Schemas ----- //

// Extend the deposit schema with a new computed field "bill"
const depositSchema = z.object({
  description: z.string().min(1, "Description is required"),
  rent: z.coerce.number({ invalid_type_error: "Deposit rent must be a number" }),
  per: z.enum(["month", "year"], {
    errorMap: () => ({ message: "Select a valid period" }),
  }),
  startsOn: z.string().min(1, "Start date is required"),
  closedOn: z.string().min(1, "Closed date is required"),
  month: z.enum(
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    { errorMap: () => ({ message: "Select a valid month" }) }
  ),
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
});
type RentFormData = z.infer<typeof rentSchema>;

// Options for the Deposit "Per" select field
const perOptions = [
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

// Options for the Month dropdown (1 to 12)
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: (i + 1).toString(),
  value: (i + 1).toString(),
}));

// Utility to calculate the bill using closedOn date and the period type.
const calculateBill = (rent: number, startsOn: string, closedOn: string, per: string) => {
  if (!startsOn || !closedOn) return rent;
  const start = new Date(startsOn);
  const end = new Date(closedOn);
  if (per === "month") {
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    months = months > 0 ? months : 1;
    return rent * months;
  } else if (per === "year") {
    let years = end.getFullYear() - start.getFullYear();
    years = years > 0 ? years : 1;
    return rent * years;
  }
  return rent;
};

// ----- Rent Component ----- //
interface RentComponentProps {
  propertyId: string;
}

const Rent: React.FC<RentComponentProps> = ({ propertyId }) => {
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
    formState: { errors },
  } = useForm<RentFormData>({
    resolver: zodResolver(rentSchema),
    defaultValues: { propertyId, Deposit: [] },
  });
  
  useEffect(() => {
    if (rents && Object.keys(rents).length > 0) {
      reset(rents && rents);
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
  const handleDateChange = (name: string, date: Date) => {
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
      per: "month",
      month: "1",
      startsOn: "",
      closedOn: "",
      expiryDate: "",
      bill: 0,
    },
  });

  // Handler for deposit modal submission
  const onDepositSubmit = (depositData: z.infer<typeof depositSchema>) => {
    const computedBill = calculateBill(
      depositData.rent,
      depositData.startsOn,
      depositData.closedOn,
      depositData.per
    );
    append({ ...depositData, bill: computedBill });
    toast.success("Deposit added!");
    resetDepositForm();
    setIsDepositModalOpen(false); // close the modal on submit
  };

  return (
    <>
      {/* Main Rent Form */}
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Rent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Rent Fields */}
            <InputField
              label="Amount (£)"
              name="Amount"
              register={register}
              error={errors.Amount?.message}
              placeholder="Enter rent amount"
              type="number"
              setValue={setValue}
            />
            <div>
              <label className="text-gray-700 font-medium mr-4 w-32">Received On</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "mx-4 justify-start text-left font-normal",
                      !watch("ReceivedOn") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch("ReceivedOn")
                      ? new Date(watch("ReceivedOn")).toLocaleDateString()
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch("ReceivedOn") ? new Date(watch("ReceivedOn")) : null}
                    onSelect={(date) => handleDateChange("ReceivedOn", date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.ReceivedOn && (
                <p className="text-red-600 text-sm">{errors.ReceivedOn.message}</p>
              )}
            </div>
            <InputField
              label="Hold By"
              name="HoldBy"
              register={register}
              error={errors.HoldBy?.message}
              placeholder="Enter who holds the rent"
              setValue={setValue}
            />
            <div>
              <label className="text-gray-700 font-medium mr-4 w-32">Returned On</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "mx-2 text-left font-normal",
                      !watch("ReturnedOn") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch("ReturnedOn")
                      ? new Date(watch("ReturnedOn")).toLocaleDateString()
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch("ReturnedOn") ? new Date(watch("ReturnedOn")) : null}
                    onSelect={(date) => handleDateChange("ReturnedOn", date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.ReturnedOn && (
                <p className="text-red-600 text-sm">{errors.ReturnedOn.message}</p>
              )}
            </div>
            <div>
              <label className="text-gray-700 font-medium  w-32">Date Of Agreement</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "mx-2 text-left font-normal",
                      !watch("DateOfAgreement") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch("DateOfAgreement")
                      ? new Date(watch("DateOfAgreement")).toLocaleDateString()
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch("DateOfAgreement") ? new Date(watch("DateOfAgreement")) : null}
                    onSelect={(date) => handleDateChange("DateOfAgreement", date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.DateOfAgreement && (
                <p className="text-red-600 text-sm">{errors.DateOfAgreement.message}</p>
              )}
            </div>
            <InputField
              label="No. Of Occupants"
              name="NoOfOccupant"
              register={register}
              error={errors.NoOfOccupant?.message}
              placeholder="Enter number of occupants"
              type="number"
              setValue={setValue}
            />
            <InputField
              label="DSS Ref"
              name="DssRef"
              register={register}
              error={errors.DssRef?.message}
              placeholder="Enter DSS reference"
              setValue={setValue}
            />
            <InputField
              label="How Furnished"
              name="HowFurnished"
              register={register}
              error={errors.HowFurnished?.message}
              placeholder="Enter furnishing details"
              setValue={setValue}
            />
            <TextAreaField
              label="Note"
              name="Note"
              register={register}
              error={errors.Note?.message}
              placeholder="Enter note (optional)"
            />

            {/* Deposits List */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Deposits</h3>
                <Button type="button" onClick={() => setIsDepositModalOpen(true)}>
                  Add Deposit
                </Button>
              </div>
              {depositFields.length > 0 && (
                <div className="space-y-2">
                  {depositFields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{field.description}</p>
                        <p className="text-sm">
                          Rent: £{field.rent} | Bill: £{field.bill} | Per: {field.per} | Month: {field.month}
                        </p>
                        <p className="text-sm">
                          {new Date(field.startsOn).toLocaleDateString()} -{" "}
                          {new Date(field.closedOn).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="destructive" onClick={() => remove(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit">Update Rent</Button>
          </form>
        </CardContent>
      </Card>

      {/* Deposit Modal (rendered outside the main form) */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[70vh] overflow-y-auto">
          <DialogTitle>Add Deposit</DialogTitle>
          <form onSubmit={handleDepositSubmit(onDepositSubmit)} className="space-y-4">
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
            <SelectField
              label="Per"
              name="per"
              options={perOptions}
              register={depositRegister}
              onChange={(value: string) => setDepositValue("per", value)}
              error={depositErrors.per?.message?.toString()}
              watch={depositWatch}
              setValue={setDepositValue}
            />
            <SelectField
              label="Month"
              name="month"
              options={monthOptions}
              register={depositRegister}
              onChange={(value: string) => setDepositValue("month", value)}
              error={depositErrors.month?.message?.toString()}
              watch={depositWatch}
              setValue={setDepositValue}
            />
            <div>
              <label className="text-gray-700 font-medium">Starts On</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "mx-2 text-left font-normal",
                      !depositWatch("startsOn") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {depositWatch("startsOn")
                      ? new Date(depositWatch("startsOn")).toLocaleDateString()
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={depositWatch("startsOn") ? new Date(depositWatch("startsOn")) : null}
                    onSelect={(date) => setDepositValue("startsOn", date.toISOString())}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {depositErrors.startsOn && (
                <p className="text-red-600 text-sm">{depositErrors.startsOn.message}</p>
              )}
            </div>
            <div>
              <label className="text-gray-700 font-medium">Closed On</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "mx-2 text-left font-normal",
                      !depositWatch("closedOn") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {depositWatch("closedOn")
                      ? new Date(depositWatch("closedOn")).toLocaleDateString()
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={depositWatch("closedOn") ? new Date(depositWatch("closedOn")) : null}
                    onSelect={(date) => setDepositValue("closedOn", date.toISOString())}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {depositErrors.closedOn && (
                <p className="text-red-600 text-sm">{depositErrors.closedOn.message}</p>
              )}
            </div>
            <div>
              <label className="text-gray-700 font-medium">Expiry Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "mx-2 text-left font-normal",
                      !depositWatch("expiryDate") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {depositWatch("expiryDate")
                      ? new Date(depositWatch("expiryDate")).toLocaleDateString()
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={depositWatch("expiryDate") ? new Date(depositWatch("expiryDate")) : null}
                    onSelect={(date) => setDepositValue("expiryDate", date.toISOString())}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {depositErrors.expiryDate && (
                <p className="text-red-600 text-sm">{depositErrors.expiryDate.message}</p>
              )}
            </div>
            <div>
              <label className="text-gray-700 font-medium">Bill (£)</label>
              <input
                type="number"
                readOnly
                value={calculateBill(
                  Number(depositWatch("rent")),
                  depositWatch("startsOn"),
                  depositWatch("closedOn"),
                  depositWatch("per")
                )}
                className="w-full border rounded p-2 bg-gray-100"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="submit">Add Deposit</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Rent;
