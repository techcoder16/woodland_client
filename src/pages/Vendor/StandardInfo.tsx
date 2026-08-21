import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import countriesData from '../../data/ukCountry.json';
import AddressSearchField from '@/components/AddressSearchField';

const StandardInfo = ({ register, watch, clearErrors, setValue, errors, isEdit }: any) => {
  const handleSelectChange = (name: string, value: string) => {
    setValue(name, value);
    clearErrors(name);
  };

  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Personal Information</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField setValue={setValue} label="First Name" name="firstName" register={register} error={errors.firstName?.message?.toString()} />
          <InputField setValue={setValue} label="Last Name" name="lastName" register={register} error={errors.lastName?.message?.toString()} />
        </div>
      </div>

      <hr />

      <div className="mt-3">
        <div className="text-lg font-medium flex justify-start underline p-5">Address</div>

        <div className="px-5 pb-4">
          <AddressSearchField
            onSelect={(address) => {
              if (address.addressLine1) setValue('addressLine1', address.addressLine1, { shouldValidate: true });
              if (address.addressLine2) setValue('addressLine2', address.addressLine2);
              if (address.town) setValue('town', address.town);
              if (address.postCode) setValue('postCode', address.postCode);
              clearErrors(['addressLine1', 'postCode']);
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField setValue={setValue} label="Post Code" name="postCode" register={register} error={errors.postCode?.message?.toString()} />
          <InputField setValue={setValue} label="Address Line 1" name="addressLine1" register={register} error={errors.addressLine1?.message?.toString()} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField setValue={setValue} label="Address Line 2" name="addressLine2" register={register} error={errors.addressLine2?.message?.toString()} />
          <InputField setValue={setValue} label="Town" name="town" register={register} error={errors.town?.message?.toString()} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <hr />

      <div>
        <div className="text-lg font-medium flex justify-start underline p-5">Contact Info</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField setValue={setValue} label="Phone" name="phone" register={register} error={errors.phone?.message?.toString()} />
          {isEdit ? (
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium text-sm">Email</label>
              <div className="text-sm py-2">{watch("email")}</div>
              <p className="text-xs text-muted-foreground">Email is the landlord's login and can't be changed here.</p>
            </div>
          ) : (
            <InputField
              setValue={setValue}
              label="Email"
              name="email"
              register={register}
              error={errors.email?.message?.toString()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StandardInfo;
