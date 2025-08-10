// src/components/SupplierInventory.tsx
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/utils/InputField";
import SelectField from "@/utils/SelectedField";
import TextAreaField from "@/utils/TextAreaField";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/reduxHooks";
import { fetchSupplier, upsertSupplier } from "@/redux/dataStore/supplierSlice";
import { INVENTORY, LOCATION } from "@/lib/constant";

// ----- Supplier Data ----- //
const suppliersList = [
  { value: "British Gas", label: "British Gas", phone: "08458500393" },
  { value: "Thames Water", label: "Thames Water", phone: "" },
  { value: "POWERGEN", label: "POWERGEN", phone: "08001831300 / 08001831515 / 01234323340" },
  { value: "Three Valleys Water", label: "Three Valleys Water", phone: "08457697982" },
  { value: "British Gas Electricity", label: "British Gas Electricity", phone: "08457888500" },
  { value: "London Energy", label: "London Energy", phone: "08000962255" },
  { value: "NPOWER", label: "NPOWER", phone: "08003168558" },
  { value: "Southern Electric Gas Ltd", label: "Southern Electric Gas Ltd", phone: "08457585401" },
  { value: "Transco", label: "Transco", phone: "08706081524" },
  { value: "Scottish power", label: "Scottish power", phone: "08452700700" },
  { value: "Eastern Electricity", label: "Eastern Electricity", phone: "08001831515" },
  { value: "London Electricity Domestic", label: "London Electricity Domestic", phone: "0500005008" },
];

// ----- Utility Section Config ----- //
const utilitySections = [
  { key: "electricity", label: "Electricity" },
  { key: "gas", label: "Gas" },
  { key: "Water", label: "Water" },
  { key: "Borough", label: "Borough" }, // Borough will be input only
];

// ----- Zod Schemas ----- //
const inventoryItemSchema = z.object({
  location: z.string().min(1, "Location is required"),
  detail: z.string().optional(),
  item: z.string().optional(),
  quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" }),
  condition: z.string().min(1, "Condition is required"),
});

const supplierSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  inventory: z.array(inventoryItemSchema),
  ...utilitySections.reduce((acc, section) => {
    acc[`${section.key}Supplier`] = z.string().min(1, `${section.label} Supplier is required`);
    acc[`${section.key}Phone`] = z.string().min(1, `${section.label} Phone is required`);
    acc[`${section.key}MeterNo`] = z.coerce.number({ invalid_type_error: `${section.label} Meter No must be a number` });
    acc[`${section.key}ReadingOne`] = z.coerce.number({ invalid_type_error: `${section.label} Reading One must be a number` });
    acc[`${section.key}ReadingTwo`] = z.coerce.number({ invalid_type_error: `${section.label} Reading Two must be a number` });
    return acc;
  }, {} as Record<string, any>)
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierInventoryProps {
  propertyId: string;
}

const SupplierInventory: React.FC<SupplierInventoryProps> = ({ propertyId }) => {
  const dispatch = useDispatch<any>();
  const { supplier } = useAppSelector((state) => state.supplierData);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { propertyId, inventory: [] },
  });

  // Inventory field array
  const { fields: inventoryFields, append, remove } = useFieldArray({
    control,
    name: "inventory",
  });

  // Fetch supplier data
  useEffect(() => {
    dispatch(fetchSupplier({ propertyId }));
  }, [dispatch, propertyId]);

  useEffect(() => {
    if (supplier && Object.keys(supplier).length > 0) {
      reset(supplier);
    }
  }, [supplier, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    try {
      await dispatch(upsertSupplier(data)).unwrap();
      toast.success("Supplier details updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update supplier details");
    }
  };

  const handleSupplierChange = (sectionKey: string, supplierValue: string) => {
    setValue(`${sectionKey}Supplier`, supplierValue);
    const selected = suppliersList.find((s) => s.value === supplierValue);
    if (selected) {
      setValue(`${sectionKey}Phone`, selected.phone);
    }
  };

  // Inventory modal form
  const {
    register: inventoryRegister,
    handleSubmit: handleInventorySubmit,
    reset: resetInventoryForm,
    setValue:setInventoryValue,
    watch: inventoryWatch,
    formState: { errors: inventoryErrors },
  } = useForm<z.infer<typeof inventoryItemSchema>>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      location: "",
      quality: "",
      detail: "",
      quantity: 0,
      condition: "",
    },
  });

  const onInventorySubmit = (itemData: z.infer<typeof inventoryItemSchema>) => {
    append(itemData);
    toast.success("Inventory item added!");
    resetInventoryForm();
    setIsInventoryModalOpen(false);
  };

  return (
    <>
      {/* Main Supplier Form */}
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Supplier / Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("propertyId")} />

            {/* Render Utility Sections Dynamically */}
            {utilitySections.map((section) => (
              <div key={section.key} className="border p-3 rounded">
                <h3 className="text-lg font-semibold mb-2">{section.label} Details</h3>

                {/* Row 1: Supplier + Phone */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {section.key !== "Borough" ? (
                    <SelectField
                      label={`${section.label} Supplier`}
                      name={`${section.key}Supplier`}
                      register={register}
                      error={errors[`${section.key}Supplier`]?.message as string}
                      watch={watch}
                      options={suppliersList}
                      setValue={setValue}
                      onChange={(value) => handleSupplierChange(section.key, value)}
                    />
                  ) : (
                    <InputField
                      label={`${section.label} Supplier`}
                      name={`${section.key}Supplier`}
                      register={register}
                      error={errors[`${section.key}Supplier`]?.message as string}
                      placeholder={`Enter ${section.label} supplier`}
                      setValue={setValue}
                    />
                  )}

                  <InputField
                    label={`${section.label} Phone`}
                    name={`${section.key}Phone`}
                    register={register}
                    error={errors[`${section.key}Phone`]?.message as string}
                    placeholder={`Enter ${section.label} phone`}
                    setValue={setValue}
                  />
                </div>

                {/* Row 2: Meter No + Reading One */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <InputField
                    label={`${section.label} Meter No`}
                    name={`${section.key}MeterNo`}
                    register={register}
                    error={errors[`${section.key}MeterNo`]?.message as string}
                    placeholder={`Enter ${section.label} meter number`}
                    type="number"
                    setValue={setValue}
                  />

                  <InputField
                    label={`${section.label} Reading(I)`}
                    name={`${section.key}ReadingOne`}
                    register={register}
                    error={errors[`${section.key}ReadingOne`]?.message as string}
                    placeholder={`Enter first reading`}
                    type="number"
                    setValue={setValue}
                  />
                </div>

                {/* Row 3: Reading Two */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label={`${section.label} Reading(F)`}
                    name={`${section.key}ReadingTwo`}
                    register={register}
                    error={errors[`${section.key}ReadingTwo`]?.message as string}
                    placeholder={`Enter second reading`}
                    type="number"
                    setValue={setValue}
                  />

                  {/* Empty column so layout stays aligned */}
                  <div></div>
                </div>
              </div>
            ))}


            {/* General Phone
            <InputField
              label="Phone"
              name="Phone"
              register={register}
              error={errors.Phone?.message}
              placeholder="Enter phone number"
              setValue={setValue}
            /> */}

            {/* Inventory List */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Inventory</h3>
                <Button type="button" onClick={() => setIsInventoryModalOpen(true)}>
                  Add Inventory
                </Button>
              </div>
              {inventoryFields.length > 0 && (
                <div className="space-y-2">
                  {inventoryFields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{field.location}</p>
                        <p className="text-sm">
                          Quality: {field.quality} | Quantity: {field.quantity} | Condition: {field.condition}
                        </p>
                        {field.detail && <p className="text-sm">Detail: {field.detail}</p>}
                      </div>
                      <Button variant="destructive" onClick={() => remove(index)}>
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit">Update Supplier Details</Button>
          </form>
        </CardContent>
      </Card>

      {/* Inventory Modal */}
      <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Add Inventory Item</DialogTitle>
          <form onSubmit={handleInventorySubmit(onInventorySubmit)} className="space-y-4">
            <SelectField
              label="Location"
              name="location"
              watch={inventoryWatch}
              register={inventoryRegister}
              error={inventoryErrors.location?.message}
              options={LOCATION}
              setValue={setInventoryValue}
             onChange={(value: any) => setInventoryValue("location", value)}
            />

            <SelectField
              label="Item"
              name="item"
              watch={inventoryWatch}
              register={inventoryRegister}
              error={inventoryErrors.item?.message}
              options={INVENTORY}
       

               setValue={setInventoryValue}
             onChange={(value: any) => setInventoryValue("item", value)}
            />


            <TextAreaField
              label="Detail"
              name="detail"
              register={inventoryRegister}
              error={inventoryErrors.detail?.message}
              placeholder="Enter details (optional)"

       
            />
            <InputField
              label="Quantity"
              name="quantity"
              register={inventoryRegister}
              error={inventoryErrors.quantity?.message}
              placeholder="Enter quantity"
              type="number"
              max={10}
            
              setValue={() => { }}
            />
            <SelectField
              label="Condition"
              name="condition"
              register={inventoryRegister}
              error={inventoryErrors.condition?.message}
              watch={inventoryWatch}
              options={[
                { label: "Excellent", value: "excellent" },
                { label: "Poor", value: "poor" },
                { label: "Good", value: "good" }
              ]}
          
                   setValue={setInventoryValue}
             onChange={(value: any) => setInventoryValue("condition", value)}
            />
            <div className="flex justify-end space-x-2">
              <Button type="submit">Add Item</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupplierInventory;
