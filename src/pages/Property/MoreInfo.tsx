import React from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import InputSelect from '@/utils/InputSelect';
import TextAreaField from '@/utils/TextAreaField';

interface MoreInfoProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
}

const MoreInfo = ({ register, watch, clearErrors, setValue, errors, type }: MoreInfoProps) => {
  // Options for the new fields
  const yesNoOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ];

  const branchOptions = [
    { value: 'woodland', label: 'Woodland' },
    // Add more branch options if needed
  ];

  const negotiatorOptions = [
    { value: 'skumar', label: 'Skumar' },
    // Add more negotiator options if needed
  ];

  const viewingOptions = [
    { value: 'agent', label: 'Agent' },
    { value: 'landlord', label: 'Landlord' },
  ];

  const vendorApprovalOptions = yesNoOptions;

  const tenureOptions = [
    { value: 'Freehold', label: 'Freehold' },
    { value: 'Leasehold', label: 'Leasehold' },
    { value: 'Share of Freehold', label: 'Share of Freehold' },
    { value: 'Virtual Freehold', label: 'Virtual Freehold' },
    { value: 'Other', label: 'Other' },
  ];

  const councilOptions = [
    { value: 'council1', label: 'Council 1' },
    { value: 'council2', label: 'Council 2' },
    // Add more council options if needed
  ];

  return (
    <div className="w-full">
      {/* Conveyancing Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Conveyancing</div>
        <InputField
          setValue={setValue}
          label="Conveyancing Solicitor"
          name="Solicitor"
          register={register}
          error={errors.Solicitor?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Guaranteed Rent Landlord"
          name="GuaranteedRentLandlord"
          register={register}
          error={errors.GuaranteedRentLandlord?.message?.toString()}
        />
      </div>

      {/* Internal Info Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Internal Info</div>
        <SelectField
          label="Branch"
          name="Branch"
          watch={watch}
          setValue={setValue}
          options={branchOptions}
          register={register}
          error={errors.Branch?.message?.toString()}
          onChange={(value: string) => {
            setValue('Branch', value);
            clearErrors('Branch');
          }}
        />
        <SelectField
          label="Negotiator"
          name="Negotiator"
          watch={watch}
          setValue={setValue}
          options={negotiatorOptions}
          register={register}
          error={errors.Negotiator?.message?.toString()}
          onChange={(value: string) => {
            setValue('Negotiator', value);
            clearErrors('Negotiator');
          }}
        />
        <SelectField
          label="Who does viewing"
          name="whodoesviewings"
          watch={watch}
          setValue={setValue}
          options={viewingOptions}
          register={register}
          error={errors.whodoesviewings?.message?.toString()}
          onChange={(value: string) => {
            setValue('whodoesviewings', value);
            clearErrors('whodoesviewings');
          }}
        />
        <TextAreaField
          label="Comments or viewing arrangements"
          name="comments"
          register={register}
          error={errors.comments?.message?.toString()}
        />
      </div>

      {/* Custom Fields Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Custom Fields</div>
        <SelectField
          label="Subject to vendor's approval"
          name="sva"
          watch={watch}
          setValue={setValue}
          options={vendorApprovalOptions}
          register={register}
          error={errors.sva?.message?.toString()}
          onChange={(value: string) => {
            setValue('sva', value);
            clearErrors('sva');
          }}
        />
        <SelectField
          label="Tenure"
          name="tenureA"
          watch={watch}
          setValue={setValue}
          options={tenureOptions}
          register={register}
          error={errors.tenureA?.message?.toString()}
          onChange={(value: string) => {
            setValue('tenureA', value);
            clearErrors('tenureA');
          }}
        />
        <SelectField
          label="Garden"
          name="customGarden"
          watch={watch}
          setValue={setValue}
          options={yesNoOptions}
          register={register}
          error={errors.customGarden?.message?.toString()}
          onChange={(value: string) => {
            setValue('customGarden', value);
            clearErrors('customGarden');
          }}
        />
        <SelectField
          label="Parking"
          name="customParking"
          watch={watch}
          setValue={setValue}
          options={yesNoOptions}
          register={register}
          error={errors.customParking?.message?.toString()}
          onChange={(value: string) => {
            setValue('customParking', value);
            clearErrors('customParking');
          }}
        />
        <SelectField
          label="Pets"
          name="pets"
          watch={watch}
          setValue={setValue}
          options={yesNoOptions}
          register={register}
          error={errors.pets?.message?.toString()}
          onChange={(value: string) => {
            setValue('pets', value);
            clearErrors('pets');
          }}
        />
        <InputField
          setValue={setValue}
          label="Train"
          name="train"
          register={register}
          error={errors.train?.message?.toString()}
        />
      </div>
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">More Info</div>
        <InputField
          setValue={setValue}
          label="Occupant"
          name="occupant"
          register={register}
          error={errors.train?.message?.toString()}
        />

<InputField
          setValue={setValue}
          label="Occupant email"
          name="occupantEmail"
          register={register}
          error={errors.occupantEmail?.message?.toString()}
        />

<InputField
          setValue={setValue}
          label="Occupant mobile"
          name="occupantMobile"
          register={register}
          error={errors.occupantMobile?.message?.toString()}
        />
          
        </div>

      {/* More Info Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">More Info</div>
        <SelectField
          label="Council"
          name="council"
          watch={watch}
          setValue={setValue}
          options={councilOptions}
          register={register}
          error={errors.council?.message?.toString()}
          onChange={(value: string) => {
            setValue('council', value);
            clearErrors('council');
          }}
        />
        <InputField
          setValue={setValue}
          label="Council Band"
          name="councilBand"
          register={register}
          error={errors.councilBand?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Freeholder"
          name="freeholder"
          register={register}
          error={errors.freeholder?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Freeholder's Contact"
          name="freeholderContract"
          register={register}
          error={errors.freeholderContract?.message?.toString()}
        />
        <TextAreaField
          label="Freeholder's Address"
          name="freeholderAddress"
          register={register}
          error={errors.freeholderAddress?.message?.toString()}
        />
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="nonGasProperty"
            name="nonGasProperty"
            onChange={(e) => setValue('nonGasProperty', e.target.checked)}
          />
          <label htmlFor="nonGasProperty" className="ml-2">Non-gas Property</label>
        </div>
        <InputField
          setValue={setValue}
          label="Insurer"
          name="insurer"
          register={register}
          error={errors.insurer?.message?.toString()}
        />
      </div>
    </div>
  );
};

export default MoreInfo;
