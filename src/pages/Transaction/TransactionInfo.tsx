import React, { useEffect } from "react";
import InputField from "../../utils/InputField";
import SelectField from "@/utils/SelectedField";
import { DateField } from "@/utils/DateField";
import TextAreaField from "@/utils/TextAreaField";
import { BANKOPTIONS } from "@/lib/constant";

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
  setValue,
  errors,
}: TenantProps) => {
  const handleDateChange = (name: any, date: Date) => {
    setValue(name, date.toISOString());
  };
  useEffect(() => {
    const expenditure = Number(watch("toLandlordLessBuildingExpenditure")) || 0;
    const actual = Number(watch("toLandlordLessBuildingExpenditureActual")) || 0;
    setValue("toLandlordLessBuildingExpenditureDifference", expenditure - actual);
  
  }, [
    watch("toLandlordLessBuildingExpenditure"),
    watch("toLandlordLessBuildingExpenditureActual"),

    setValue
  ]);


  

   useEffect(() => {
    const netRecieved = Number(watch("toLandlordRentReceived")) || 0;
    const lessBuildingExpenditure = Number(watch("toLandlordLessBuildingExpenditure")|| 0);
    const lessVat = Number(watch("toLandlordLessVAT")|| 0);
     const toLandlordLessManagementFees = Number(watch("toLandlordLessManagementFees")|| 0);
    
   
    setValue("toLandlordNetPaid", netRecieved - (lessBuildingExpenditure + lessVat + toLandlordLessManagementFees));

  
  }, [
    watch("toLandlordNetPaid"),
    watch("toLandlordLessBuildingExpenditure"),
    watch("toLandlordLessManagementFees"),
    watch("toLandlordRentReceived"),
    watch ("toLandlordLessVAT"),

    setValue
  ]);


  
  const handleSelectChange = (name: string, value: string) => {
    console.log(name,value)
    setValue(name, value);

  };
  
  return (
    <div className="w-full max-h-[80vh] overflow-y-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* From Tenant */}
        <div className="flex-1 border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-lg font-semibold border-b pb-2 mb-4">From Tenant</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <DateField
              label="Date"
              value={watch("fromTenantDate") || ""}
              onChange={(date) => handleDateChange("fromTenantDate", date)}
              error={errors.fromTenantDate?.message}
              placeholder="Tenant Date"
            />

            <SelectField
              setValue={setValue}
              label="Mode"
              name="fromTenantMode"
              register={register}
              error={errors?.fromTenantMode?.message?.toString()}
              options={BANKOPTIONS}
              watch={watch}
            />

            <InputField label="H.Benefit 1" name="fromTenantHBenefit1" type="number" {...{ register, setValue, errors }} />
            <InputField label="H.Benefit 2" name="fromTenantHBenefit2" type="number" {...{ register, setValue, errors }} />
            <InputField label="Rent Received" name="fromTenantRentReceived" type="number" {...{ register, setValue, errors }} />
            <InputField label="Other Debit" name="fromTenantOtherDebit" type="number" {...{ register, setValue, errors }} />
            <TextAreaField label="Description" name="fromTenantDescription" register={register} error={errors?.fromTenantDescription?.message?.toString()} />
            <InputField label="Received By" name="fromTenantReceivedBy" {...{ register, setValue, errors }} />
            <InputField label="Private Note" name="fromTenantPrivateNote" {...{ register, setValue, errors }} />

          </div>
        </div>

        {/* To Landlord */}
        <div className="flex-1 border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-lg font-semibold border-b pb-2 mb-4">To Landlord</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <DateField
              label="Date"
              value={watch("toLandlordDate") || ""}
              onChange={(date) => handleDateChange("toLandlordDate", date)}
              error={errors.toLandlordDate?.message}
              placeholder="Landlord Date"

            />


            <SelectField
              setValue={setValue}
              label="Mode"
              name="toLandLordMode"
              register={register}

            onChange={(value) => handleSelectChange("toLandLordMode", value)}

              error={errors?.toLandLordMode?.message?.toString()}
              watch={watch}
              options={BANKOPTIONS}
            />
            <InputField label="Rent Received" name="toLandlordRentReceived" type="number" {...{ register, setValue, errors }} />

            <InputField label="Less Management Fees" name="toLandlordLessManagementFees" type="number" {...{ register, setValue, errors }} />
            <InputField label="Less Building Expenditure" name="toLandlordLessBuildingExpenditure" type="number" {...{ register, setValue, errors }} />
            <InputField label="Actual" name="toLandlordLessBuildingExpenditureActual" type="number" {...{ register, setValue, errors }} />
            <InputField label="Difference" name="toLandlordLessBuildingExpenditureDifference" type="number" {...{ register, setValue, errors }} />
            {/* <InputField label="Net Received" name="toLandlordNetReceived" type="number" {...{ register, setValue, errors }} /> */}
            <InputField label="Less VAT" name="toLandlordLessVAT" type="number" {...{ register, setValue, errors }} />
            <InputField label="Net Paid" name="toLandlordNetPaid" type="number" {...{ register, setValue, errors }} />
            <InputField label="Cheque No" name="toLandlordChequeNo" {...{ register, setValue, errors }} />
            <TextAreaField label="Detail of  Expenditure" name="toLandlordDefaultExpenditure" {...{ register, setValue, errors }} />
            <TextAreaField label="Expenditure Description" name="toLandlordExpenditureDescription" {...{ register, setValue, errors }} />
            <InputField label="Received By" name="toLandlordPaidBy" {...{ register, setValue, errors }} />

          </div>
        </div>

      </div>
    </div>
  );
};

export default TranscationInfo;
