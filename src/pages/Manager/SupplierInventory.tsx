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
import FileUploadField from "@/utils/FileUploadField";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  {
    value: "London Electricity Domestic",
    label: "London Electricity Domestic",
    phone: "0500005008",
  },
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
  inventoryImage: z.array(
    z
      .string()
      .regex(/^data:image\/[a-zA-Z+]+;base64,/, {
        message: "Only valid image files in Base64 format are allowed.",
      })
      .nonempty("Required")
  ),
});

const supplierSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  inventory: z.array(inventoryItemSchema),
  ...utilitySections.reduce((acc, section) => {
    acc[`${section.key}Supplier`] = z.string().min(1, `${section.label} Supplier is required`);
    acc[`${section.key}Phone`] = z.string().min(1, `${section.label} Phone is required`);
    acc[`${section.key}MeterNo`] = z.coerce.number({
      invalid_type_error: `${section.label} Meter No must be a number`,
    });
    acc[`${section.key}ReadingOne`] = z.coerce.number({
      invalid_type_error: `${section.label} Reading One must be a number`,
    });
    acc[`${section.key}ReadingTwo`] = z.coerce.number({
      invalid_type_error: `${section.label} Reading Two must be a number`,
    });
    return acc;
  }, {} as Record<string, any>),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierInventoryProps {
  propertyId: string;
}

const SupplierInventory: React.FC<SupplierInventoryProps> = ({ propertyId }) => {
  const dispatch = useDispatch<any>();
  const { supplier } = useAppSelector(state => state.supplierData);
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
  const {
    fields: inventoryFields,
    append,
    remove,
  } = useFieldArray({
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

  const handleSupplierChange = (sectionKey?: string, supplierValue?: string) => {
    setValue(`${sectionKey}Supplier`, supplierValue);
    const selected = suppliersList.find(s => s.value === supplierValue);
    if (selected) {
      setValue(`${sectionKey}Phone`, selected.phone);
    }
  };

  // Inventory modal form
  const {
    register: inventoryRegister,
    handleSubmit: handleInventorySubmit,
    reset: resetInventoryForm,
    setValue: setInventoryValue,
    watch: inventoryWatch,
    formState: { errors: inventoryErrors },
  } = useForm<z.infer<typeof inventoryItemSchema>>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      location: "",
      detail: "",

      condition: "",
    },
  });
  console.log(errors);

  console.log(inventoryErrors);
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

            <Tabs defaultValue="electricity" className="w-full">
              <TabsList className="mb-4">
                {utilitySections.map(section => (
                  <TabsTrigger key={section.key} value={section.key}>
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {utilitySections.map(section => (
                <TabsContent key={section.key} value={section.key}>
                  <div className="border p-3 rounded space-y-4">
                    <h3 className="text-lg font-semibold">{section.label} Details</h3>

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
                          onChange={value => handleSupplierChange(section.key, value)}
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
                        type="number"
                        setValue={setValue}
                      />
                      <InputField
                        label={`${section.label} Reading(I)`}
                        name={`${section.key}ReadingOne`}
                        register={register}
                        error={errors[`${section.key}ReadingOne`]?.message as string}
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
                        type="number"
                        setValue={setValue}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Detail</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryFields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>{field.location}</TableCell>
                          <TableCell>{field.quantity}</TableCell>
                          <TableCell>{field.condition}</TableCell>
                          <TableCell>{field.detail || "-"}</TableCell>
                          <TableCell>
                            {field.inventoryImage ? (
                              <img
                                src={field.inventoryImage}
                                alt="Inventory"
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              "No image"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="destructive" onClick={() => remove(index)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <Button type="submit">Update Supplier Details</Button>
          </form>
        </CardContent>
      </Card>

      {/* Inventory Modal */}
      <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
        <DialogContent className="w-full flex-grid">
          <DialogTitle>Add Inventory Item</DialogTitle>
          <form onSubmit={handleInventorySubmit(onInventorySubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Quantity"
                name="quantity"
                register={inventoryRegister}
                error={inventoryErrors.quantity?.message}
                placeholder="Enter quantity"
                type="number"
                max={10}
                setValue={() => {}}
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
                  { label: "Good", value: "good" },
                ]}
                setValue={setInventoryValue}
                onChange={(value: any) => setInventoryValue("condition", value)}
              />
            </div>
            <div className="grid">
              <TextAreaField
                label="Detail"
                name="detail"
                register={inventoryRegister}
                error={inventoryErrors.detail?.message}
                placeholder="Enter details (optional)"
              />
            </div>
            <div className="mb-4">
              <FileUploadField
                label="Inventory Image"
                name="inventoryImage"
                accept="image/*"
                register={inventoryRegister}
                setValue={setInventoryValue}
                watch={inventoryWatch}
                error={inventoryErrors.inventoryImage?.message}
              />
            </div>

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
