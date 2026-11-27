import InputField from '../../utils/InputField';

const BankDetails = ({ register, setValue, errors }: any) => {
  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Bank details</div>
        <p className="px-5 pb-3 text-sm text-muted-foreground">This becomes the landlord's default account. More accounts can be added on the landlord's page.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField setValue={setValue} label="Bank Name" name="bankBankName" register={register} error={errors.bankBankName?.message?.toString()} />
          {/* Stored in bankName — the label is "Account Name" (the account holder's name). */}
          <InputField setValue={setValue} label="Account Name" name="bankName" register={register} error={errors.bankName?.message?.toString()} />
          <InputField setValue={setValue} label="Account Number" name="bankAccountNo" register={register} error={errors.bankAccountNo?.message?.toString()} />
          <InputField setValue={setValue} label="Sort Code" name="bankSortCode" register={register} error={errors.bankSortCode?.message?.toString()} />
        </div>
      </div>
    </div>
  );
};

export default BankDetails;
