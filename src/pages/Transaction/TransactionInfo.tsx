import React from "react";

import InputField from "../../utils/InputField";
import SelectField from "@/utils/SelectedField";
import { DateField } from "../Manager/Rent";

interface TenantProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
}

const TranscationInfo = ({
  register,
  watch,
  clearErrors,
  setValue,
  errors,
}: TenantProps) => {
  // Title options for select

  // Optional: handle select change if needed
  const handleSelectChange = (name: string, value: string) => {
    setValue(name, value);
    clearErrors(name);
  };

   const handleDateChange = (name: any, date: Date) => {
    setValue(name, date.toISOString());
  };


return (
  <div className="w-full ">
    <div className="flex gap-8">
      {/* From Tenant Section */}
      <div className="flex-1">
        <div className="text-lg font-medium underline p-5">From Tenant</div>
        <div className="grid grid-cols-1 gap-4 mb-8">
          <DateField
            label="Date"
            value={watch("Date") || ""}
            onChange={(date) => handleDateChange("Date", date)}
            error={errors.ReturnedOn?.message}
            placeholder="Pick return date (optional)"
          />
          <InputField
            setValue={setValue}
            label="Rent Received"
            name="toTenantRentReceived"
            register={register}
            error={errors?.toTenantRentReceived?.message?.toString()}
            type="number"
          />
          {/* rest of From Tenant inputs */}
          <InputField
            setValue={setValue}
            label="Other Debit"
            name="toTenantOtherDebit"
            register={register}
            error={errors?.toTenantOtherDebit?.message?.toString()}
            type="number"
          />
          <InputField
            setValue={setValue}
            label="Description"
            name="toTenantDescription"
            register={register}
            error={errors?.toTenantDescription?.message?.toString()}
          />
          <InputField
            setValue={setValue}
            label="Received By"
            name="toTenantReceivedBy"
            register={register}
            error={errors?.toTenantReceivedBy?.message?.toString()}
          />
          <InputField
            setValue={setValue}
            label="Private Note"
            name="toTenantPrivateNote"
            register={register}
            error={errors?.toTenantPrivateNote?.message?.toString()}
          />
        </div>
      </div>

      {/* To Landlord Section */}
      <div className="flex-1">
        <div className="text-lg font-medium underline p-5">To Landlord</div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <InputField
            setValue={setValue}
            label="Date"
            name="toLandlordDate"
            register={register}
            error={errors?.toLandlordDate?.message?.toString()}
            type="date"
          />
          <InputField
            setValue={setValue}
            label="Rent Received"
            name="toLandlordRentReceived"
            register={register}
            error={errors?.toLandlordRentReceived?.message?.toString()}
            type="number"
          />
          {/* rest of To Landlord inputs */}
          <InputField
            setValue={setValue}
            label="Lease Management Fees"
            name="toLandlordLeaseManagementFees"
            register={register}
            error={errors?.toLandlordLeaseManagementFees?.message?.toString()}
            type="number"
          />
          <InputField
            setValue={setValue}
            label="Lease Building Expenditure"
            name="toLandlordLeaseBuildingExpenditure"
            register={register}
            error={errors?.toLandlordLeaseBuildingExpenditure?.message?.toString()}
            type="number"
          />
          <InputField
            setValue={setValue}
            label="Net Received"
            name="toLandlordNetReceived"
            register={register}
            error={errors?.toLandlordNetReceived?.message?.toString()}
            type="number"
          />
          <InputField
            setValue={setValue}
            label="Less VAT"
            name="toLandlordLessVAT"
            register={register}
            error={errors?.toLandlordLessVAT?.message?.toString()}
            type="number"
          />
          <InputField
            setValue={setValue}
            label="Net Paid"
            name="toLandlordNetPaid"
            register={register}
            error={errors?.toLandlordNetPaid?.message?.toString()}
            type="number"
          />
          <InputField
            setValue={setValue}
            label="Cheque No"
            name="toLandlordChequeNo"
            register={register}
            error={errors?.toLandlordChequeNo?.message?.toString()}
          />
          <InputField
            setValue={setValue}
            label="Default Expenditure"
            name="toLandlordDefaultExpenditure"
            register={register}
            error={errors?.toLandlordDefaultExpenditure?.message?.toString()}
          />
          <InputField
            setValue={setValue}
            label="Expenditure Description"
            name="toLandlordExpenditureDescription"
            register={register}
            error={errors?.toLandlordExpenditureDescription?.message?.toString()}
          />
          <InputField
            setValue={setValue}
            label="Fund By"
            name="toLandlordFundBy"
            register={register}
            error={errors?.toLandlordFundBy?.message?.toString()}
          />
        </div>
      </div>
    </div>
    </div>
  );
};


export default TranscationInfo;
