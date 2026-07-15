import React, { useCallback, useState } from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import VendorPicker from '../../utils/VendorPicker';
import RoomsTable from '../../utils/RoomsTable';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import countriesData from '../../data/counteries.json';
import { useAppSelector } from '@/redux/reduxHooks';

import { TOWN_AREA } from '@/lib/constant';

const propertyTypeCategoryOptions = [
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'flat', label: 'Flat' },
  { value: 'room', label: 'Room' },
  { value: 'maisonette', label: 'Maisonette' },
];

const PropertyInfo = ({ register, watch, clearErrors, setValue, errors, type }: any) => {

  const [isAddingArea, setIsAddingArea] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleSelectChange = useCallback(
    (name: string, value: string) => {
      setValue(name, value);
      clearErrors(name);
    },
    [setValue, clearErrors]
  );

  const forOptions = [
    { value: 'lease', label: 'Lease' },
    { value: 'management', label: 'Management' },
  ];

  const { vendors } = useAppSelector((state) => state.vendors);
  const selectedVendorId = watch('vendor');
  const selectedVendor = (vendors || []).find((v: any) => v.id === selectedVendorId);

  const landlordDetailRows = selectedVendor
    ? [
        { label: 'Name', value: `${selectedVendor.firstName ?? ''} ${selectedVendor.lastName ?? ''}`.trim() },
        {
          label: 'Address',
          value: [selectedVendor.addressLine1, selectedVendor.addressLine2, selectedVendor.town, selectedVendor.postCode, selectedVendor.country]
            .filter(Boolean)
            .join(', '),
        },
        { label: 'Phone', value: selectedVendor.phone },
        { label: 'Email', value: selectedVendor.email },
        { label: 'Bank', value: selectedVendor.bankBody },
      ].filter((row) => row.value)
    : [];

  const rooms = watch('rooms') || [];

  const propertyTypeCategory = watch('propertyTypeCategory');
  const bedrooms = watch('bedrooms');
  const bathrooms = watch('bathrooms');
  const receptions = watch('receptions');
  const detailChips = [
    propertyTypeCategory,
    bedrooms ? `${bedrooms} bed` : null,
    bathrooms ? `${bathrooms} bath` : null,
    receptions ? `${receptions} reception` : null,
    watch('wheelchairAccess') ? 'Wheelchair Access' : null,
    watch('hasGarden') ? 'Garden' : null,
    watch('lift') ? 'Lift' : null,
    watch('gas') ? 'Gas' : null,
    watch('electricity') ? 'Electricity' : null,
  ].filter(Boolean);

  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Landlord</div>
        <VendorPicker
          label="Landlord"
          name="vendor"
          watch={watch}
          setValue={setValue}
          clearErrors={clearErrors}
          error={errors.vendor?.message?.toString()}
        />

        {landlordDetailRows.length > 0 && (
          <div className="mt-3 rounded-md border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground mb-2">Landlord Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {landlordDetailRows.map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Property on market</div>
        <hr />

        <SelectField
          label="For"
          name="for"
          watch={watch}
          setValue={setValue}
          options={forOptions}
          register={register}
          error={errors.for?.message?.toString()}
          onChange={(value) => handleSelectChange('for', value)}
        />
      </div>

      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Address of property</div>

        <InputField setValue={setValue} label="Post Code" name="postCode" register={register} error={errors.postCode?.message?.toString()} />
        <InputField setValue={setValue} label="Property Name" name="propertyName" register={register} error={errors.propertyName?.message?.toString()} />
        <InputField setValue={setValue} label="Address Line 1" name="addressLine1" register={register} error={errors.addressLine1?.message?.toString()} />
        <InputField setValue={setValue} label="Address Line 2" name="addressLine2" register={register} error={errors.addressLine2?.message?.toString()} />

        {!isAddingArea ? (
          <SelectField
            label="Town/Area"
            name="town"
            watch={watch}
            setValue={setValue}
            options={TOWN_AREA}
            register={register}
            error={errors.town?.message?.toString()}
            onChange={(value) => handleSelectChange('town', value)}
          />
        ) : (
          <InputField
            setValue={setValue}
            label="Add Area"
            name="town"
            register={register}
            error={errors.town?.message?.toString()}
          />
        )}

        <button
          type="button"
          onClick={() => setIsAddingArea(!isAddingArea)}
          className="toggle-button"
        >
          {isAddingArea ? 'Choose Area' : 'Add Area Manually'}
        </button>

        <SelectField
          label="Country"
          setValue={setValue}
          watch={watch}
          name="country"
          options={countriesData}
          register={register}
          error={errors.country?.message?.toString()}
          onChange={(value) => handleSelectChange('country', value)}
        />
      </div>

      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Property Detail</div>

        <div className="px-3 space-y-3">
          {detailChips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {detailChips.map((chip, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {chip}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No property detail added yet.</p>
          )}

          <Button type="button" variant="outline" onClick={() => setIsDetailOpen(true)}>
            {detailChips.length > 0 ? 'Edit Property Detail' : 'Add Property Detail'}
          </Button>
        </div>
      </div>

      <div className="p-4 w-full">
        <RoomsTable
          rooms={rooms}
          onChange={(updatedRooms) => setValue('rooms', updatedRooms, { shouldValidate: true })}
        />
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Property Detail</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
            <SelectField
              label="Property Type"
              name="propertyTypeCategory"
              watch={watch}
              setValue={setValue}
              options={propertyTypeCategoryOptions}
              register={register}
              error={errors.propertyTypeCategory?.message?.toString()}
              onChange={(value) => handleSelectChange('propertyTypeCategory', value)}
            />
            <InputField
              setValue={setValue}
              label="No. of Bedrooms"
              name="bedrooms"
              type="number"
              register={register}
              error={errors.bedrooms?.message?.toString()}
            />
            <InputField
              setValue={setValue}
              label="No. of Bathrooms"
              name="bathrooms"
              type="number"
              register={register}
              error={errors.bathrooms?.message?.toString()}
            />
            <InputField
              setValue={setValue}
              label="No. of Receptions"
              name="receptions"
              type="number"
              register={register}
              error={errors.receptions?.message?.toString()}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-1">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!watch('wheelchairAccess')}
                onCheckedChange={(v) => setValue('wheelchairAccess', !!v)}
              />
              Wheelchair Access
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!watch('hasGarden')}
                onCheckedChange={(v) => setValue('hasGarden', !!v)}
              />
              Garden
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!watch('lift')}
                onCheckedChange={(v) => setValue('lift', !!v)}
              />
              Lift
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!watch('gas')}
                onCheckedChange={(v) => setValue('gas', !!v)}
              />
              Gas
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!watch('electricity')}
                onCheckedChange={(v) => setValue('electricity', !!v)}
              />
              Electricity
            </label>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setIsDetailOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyInfo;
