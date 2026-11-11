import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import countriesData from '../../data/ukCountry.json';
import AddressSearchField from '@/components/AddressSearchField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Multiple phone numbers are stored in the single `phone` column, joined by ", ".
const PHONE_SEPARATOR = ', ';
const splitPhones = (value?: string | null) =>
  (value || '').split(',').map((p) => p.trim()).filter(Boolean);

const TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'COMPANY', label: 'Company' },
];
const CONTACT_OPTIONS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'POST', label: 'Post' },
];

const StandardInfo = ({ register, watch, clearErrors, setValue, errors, isEdit }: any) => {
  const [phones, setPhones] = useState<string[]>(() => {
    const initial = splitPhones(watch('phone'));
    return initial.length ? initial : [''];
  });

  // Country is always United Kingdom for Woodland.
  useEffect(() => {
    if (watch('country') !== 'GB') setValue('country', 'GB');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePhones = (next: string[]) => {
    setPhones(next);
    setValue('phone', next.map((p) => p.trim()).filter(Boolean).join(PHONE_SEPARATOR), { shouldDirty: true });
    clearErrors('phone');
  };

  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Personal Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Landlord Type"
            name="vendorType"
            watch={watch}
            setValue={setValue}
            options={TYPE_OPTIONS}
            register={register}
            error={errors.vendorType?.message?.toString()}
          />
          <SelectField
            label="Preferred Contact Method"
            name="preferredContact"
            watch={watch}
            setValue={setValue}
            options={CONTACT_OPTIONS}
            register={register}
            error={errors.preferredContact?.message?.toString()}
          />
          {watch('vendorType') === 'COMPANY' && (
            <div className="md:col-span-2">
              <InputField setValue={setValue} label="Company Name" name="companyName" register={register} error={errors.companyName?.message?.toString()} />
            </div>
          )}
          <InputField setValue={setValue} label={watch('vendorType') === 'COMPANY' ? 'Contact First Name' : 'First Name'} name="firstName" register={register} error={errors.firstName?.message?.toString()} />
          <InputField setValue={setValue} label={watch('vendorType') === 'COMPANY' ? 'Contact Last Name' : 'Last Name'} name="lastName" register={register} error={errors.lastName?.message?.toString()} />
        </div>
      </div>

      <hr />

      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Address</div>

        <div className="pb-4">
          <AddressSearchField
            onSelect={(address) => {
              if (address.addressLine1) setValue('addressLine1', address.addressLine1, { shouldValidate: true });
              if (address.addressLine2) setValue('addressLine2', address.addressLine2);
              if (address.town) setValue('town', address.town);
              if (address.postCode) setValue('postCode', address.postCode);
              setValue('country', 'GB');
              clearErrors(['addressLine1', 'postCode']);
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField setValue={setValue} label="Post Code" name="postCode" register={register} error={errors.postCode?.message?.toString()} />
          <InputField setValue={setValue} label="Address Line 1" name="addressLine1" register={register} error={errors.addressLine1?.message?.toString()} />
          <InputField setValue={setValue} label="Address Line 2" name="addressLine2" register={register} error={errors.addressLine2?.message?.toString()} />
          <InputField setValue={setValue} label="Town" name="town" register={register} error={errors.town?.message?.toString()} />
          <SelectField
            label="Country"
            setValue={setValue}
            watch={watch}
            name="country"
            options={countriesData}
            register={register}
            error={errors.country?.message?.toString()}
            disabled
          />
        </div>
      </div>

      <hr />

      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Contact Info</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-medium text-sm">Phone Numbers</label>
            {phones.map((phone, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="tel"
                  value={phone}
                  placeholder={i === 0 ? 'Primary phone' : 'Additional phone'}
                  onChange={(e) => updatePhones(phones.map((p, j) => (j === i ? e.target.value : p)))}
                />
                {phones.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove phone number"
                    onClick={() => updatePhones(phones.filter((_, j) => j !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => updatePhones([...phones, ''])}>
              <Plus className="mr-1 h-4 w-4" /> Add phone number
            </Button>
            {errors.phone?.message && <p className="text-destructive text-xs mt-1">{errors.phone.message.toString()}</p>}
          </div>

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
