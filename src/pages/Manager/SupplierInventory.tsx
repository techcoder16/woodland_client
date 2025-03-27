// src/components/SupplierInventory.tsx
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/utils/InputField";
import TextAreaField from "@/utils/TextAreaField";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/reduxHooks";
import { fetchSupplier, upsertSupplier } from "@/redux/dataStore/supplierSlice";

// ----- Zod Schemas ----- //

// Inventory item schema
const inventoryItemSchema = z.object({
  location: z.string().min(1, "Location is required"),
  quality: z.string().min(1, "Quality is required"),
  detail: z.string().optional(),
  quantity: z.coerce.number({ invalid_type_error: "Quantity must be a number" }),
  condition: z.string().min(1, "Condition is required"),
});

// Supplier form schema including supplier details and an array of inventory items.
const supplierSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  electricitySupplier: z.string().min(1, "Electricity Supplier is required"),
  electricityPhone: z.string().min(1, "Electricity Phone is required"),
  electricityMeterNo: z.string().min(1, "Electricity Meter No is required"),
  electricityReadingOne: z.string().min(1, "Electricity Reading One is required"),
  electricityReadingTwo: z.string().min(1, "Electricity Reading Two is required"),
  gasSupplier: z.string().min(1, "Gas Supplier is required"),
  gasPhone: z.string().min(1, "Gas Phone is required"),
  gasMeterNo: z.string().min(1, "Gas Meter No is required"),
  gasReadingOne: z.string().min(1, "Gas Reading One is required"),
  gasReadingTwo: z.string().min(1, "Gas Reading Two is required"),
  WaterSupplier: z.string().min(1, "Water Supplier is required"),
  WaterPhone: z.string().min(1, "Water Phone is required"),
  WaterMeterNo: z.string().min(1, "Water Meter No is required"),
  WaterReadingOne: z.string().min(1, "Water Reading One is required"),
  WaterReadingTwo: z.string().min(1, "Water Reading Two is required"),
  BoroughSupplier: z.string().min(1, "Borough Supplier is required"),
  BoroughPhone: z.string().min(1, "Borough Phone is required"),
  BoroughMeterNo: z.string().min(1, "Borough Meter No is required"),
  BoroughReadingOne: z.string().min(1, "Borough Reading One is required"),
  BoroughReadingTwo: z.string().min(1, "Borough Reading Two is required"),
  Phone: z.string().min(1, "Phone is required"),
  inventory: z.array(inventoryItemSchema),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

// ----- SupplierInventory Component ----- //
interface SupplierInventoryProps {
  propertyId: string;
}

const SupplierInventory: React.FC<SupplierInventoryProps> = ({ propertyId }) => {
  const dispatch = useDispatch<any>();
  // Replace with your supplier slice selector
  const { supplier } = useAppSelector((state) => state.supplierData);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { propertyId, inventory: [] },
  });

  useEffect(() => {
    if (supplier && Object.keys(supplier).length > 0) {
      reset(supplier);
    }
  }, [supplier, reset]);

  // useFieldArray for inventory items
  const { fields: inventoryFields, append, remove } = useFieldArray({
    control,
    name: "inventory",
  });

  // Fetch supplier data on mount (assuming you have a fetchSupplier action)
  useEffect(() => {
    dispatch(fetchSupplier({ propertyId }));
  }, [dispatch, propertyId]);

  const onSubmit = async (data: any) => {
    try {
      await dispatch(upsertSupplier(data)).unwrap();
      toast.success("Supplier details updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update supplier details");
    }
  };

  // Inventory modal form state
  const {
    register: inventoryRegister,
    handleSubmit: handleInventorySubmit,
    reset: resetInventoryForm,

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
            {/* Hidden Property ID */}
            <input type="hidden" {...register("propertyId")} />

            {/* Electricity Details */}
            <InputField
              label="Electricity Supplier"
              name="electricitySupplier"
              register={register}
              error={errors.electricitySupplier?.message}
              placeholder="Enter electricity supplier"
              setValue={setValue}
            />
            <InputField
              label="Electricity Phone"
              name="electricityPhone"
              register={register}
              error={errors.electricityPhone?.message}
              placeholder="Enter electricity phone"
              setValue={setValue}
            />
            <InputField
              label="Electricity Meter No"
              name="electricityMeterNo"
              register={register}
              error={errors.electricityMeterNo?.message}
              placeholder="Enter meter number"
              setValue={setValue}
        type="number"

            />
            <InputField
              label="Electricity Reading One"
              name="electricityReadingOne"
              register={register}
              error={errors.electricityReadingOne?.message}
              placeholder="Enter first reading"
              setValue={setValue}type="number"
        

            />
            <InputField
              label="Electricity Reading Two"
              name="electricityReadingTwo"
              register={register}
              error={errors.electricityReadingTwo?.message}
              placeholder="Enter second reading"
              setValue={setValue}
              type="number"
        
            />

            {/* Gas Details */}
            <InputField
              label="Gas Supplier"
              name="gasSupplier"
              register={register}
              error={errors.gasSupplier?.message}
              placeholder="Enter gas supplier"
              setValue={setValue}
            />
            <InputField
              label="Gas Phone"
              name="gasPhone"
              register={register}
              error={errors.gasPhone?.message}
              placeholder="Enter gas phone"
              setValue={setValue}

            />
            <InputField
              label="Gas Meter No"
              name="gasMeterNo"
              register={register}
              setValue={setValue}
              type="number"
        
              error={errors.gasMeterNo?.message}
              placeholder="Enter gas meter number"
            />
            <InputField
              label="Gas Reading One"
              name="gasReadingOne"
              register={register}
              setValue={setValue}
              type="number"
        
              error={errors.gasReadingOne?.message}
              placeholder="Enter first gas reading"
            />
            <InputField
              label="Gas Reading Two"
              name="gasReadingTwo"
              register={register}
              error={errors.gasReadingTwo?.message}
              setValue={setValue}
              type="number"
        
              placeholder="Enter second gas reading"
            />

            {/* Water Details */}
            <InputField
              label="Water Supplier"
              name="WaterSupplier"
              register={register}
              error={errors.WaterSupplier?.message}
              setValue={setValue}

              placeholder="Enter water supplier"
            />
            <InputField
              label="Water Phone"
              name="WaterPhone"
              register={register}
              error={errors.WaterPhone?.message}
              placeholder="Enter water phone"
              setValue={setValue}

            />
            <InputField
              label="Water Meter No"
              name="WaterMeterNo"
              register={register}
              error={errors.WaterMeterNo?.message}
              setValue={setValue}
              type="number"
        

              placeholder="Enter water meter number"
            />
            <InputField
              label="Water Reading One"
              name="WaterReadingOne"
              register={register}
              error={errors.WaterReadingOne?.message}
              placeholder="Enter first water reading"
              setValue={setValue}
              type="number"
        
            />
            <InputField
              label="Water Reading Two"
              name="WaterReadingTwo"
              register={register}
              error={errors.WaterReadingTwo?.message}
              placeholder="Enter second water reading"
              setValue={setValue}
              type="number"
        
            />

            {/* Borough Details */}
            <InputField
              label="Borough Supplier"
              name="BoroughSupplier"
              register={register}
              error={errors.BoroughSupplier?.message}
              placeholder="Enter borough supplier"
              setValue={setValue}

            />
            <InputField
              label="Borough Phone"
              name="BoroughPhone"
              register={register}
              error={errors.BoroughPhone?.message}
              placeholder="Enter borough phone"
              setValue={setValue}
            />
            <InputField
              label="Borough Meter No"
              name="BoroughMeterNo"
              register={register}
              error={errors.BoroughMeterNo?.message}
              placeholder="Enter borough meter number"
              setValue={setValue}
type="number"
        
            />
            <InputField
              label="Borough Reading One"
              name="BoroughReadingOne"
              register={register}
              error={errors.BoroughReadingOne?.message}
              placeholder="Enter first borough reading"
              setValue={setValue}

            />
            <InputField
              label="Borough Reading Two"
              name="BoroughReadingTwo"
              register={register}
              error={errors.BoroughReadingTwo?.message}
              placeholder="Enter second borough reading"
              setValue={setValue}
              type="number"
        
            />

            {/* General Phone */}
            <InputField
              label="Phone"
              name="Phone"
              register={register}
              error={errors.Phone?.message}
              placeholder="Enter phone number"
              setValue={setValue}

            />

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
                        {field.detail && (
                          <p className="text-sm">Detail: {field.detail}</p>
                        )}
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
            <InputField
              label="Location"
              name="location"
              register={inventoryRegister}
              error={inventoryErrors.location?.message}
              placeholder="Enter location"
              setValue={setValue}

            />
            <InputField
              label="Quality"
              name="quality"
              register={inventoryRegister}
              error={inventoryErrors.quality?.message}
              placeholder="Enter quality"
              setValue={setValue}
              
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
              setValue={setValue}
            />
            <InputField
              label="Condition"
              name="condition"
              register={inventoryRegister}
              error={inventoryErrors.condition?.message}
              placeholder="Enter condition"
              setValue={setValue}
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
