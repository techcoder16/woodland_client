import React from 'react';
import InputField from '../../utils/InputField';
import SelectField from '../../utils/SelectedField';
import TextAreaField from '@/utils/TextAreaField';
import FeatureSelection from '@/utils/FeatureSelection';

interface PublishProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
}

const Publish = ({ register, watch, clearErrors, setValue, errors }: PublishProps) => {
  // Options for select fields
  const publishOnWebsiteOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ];

  const portalStatusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'under_offer', label: 'Under Offer' },
    { value: 'sold_stc', label: 'Sold Stc' },
    { value: 'let_agreed', label: 'Let Agreed' },
    
  ];


  const publishOnPortalsOptions = [
    { value: 'all', label: 'All' },
    { value: 'selected', label: 'Selected' },
  ];

  const forOptions = [
    { value: 'sale', label: 'Sale' },
    { value: 'rent', label: 'Rent' },
  ];

  const propertyTypeOptions = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
  ];

  const virtualTourOptions = [
    { value: 'none', label: 'None' },
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ];

  const transactionTypeOptions = [
    { value: 'sale', label: 'Sale' },
    { value: 'rent', label: 'Rent' },
    { value: 'both', label: 'Both' },
  ];

  // List of portals for checkboxes
  const portalList = [

  'Find A Property - ftp.briefyourmarket.com' ,
   'Globrix - ftp.nethouseprices.com' ,
  'Look 4 A Property - ftp.commercialpeople-prod.com' ,
'On the market (Agents mutual) - feeds.agentsmutual.co.uk' ,
   'Primelocation - ftp.woodlandltd.com' ,
      'Property finder - ftp.nethouseprices.com' ,
   'Property Index - feeds.ezadspro.co.uk' ,
      'Propertylive - ftp.gnb.tech' ,
   'Rightmove - ftp.rightmove.co.uk' ,
   'zoomf - ftp.woodlandltd.com' ,
   'Zoopla (Think Property) - ftp.zoopla.com' 

  ];

  return (
    <div className="w-full">
      {/* Your website/internal Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium underline p-5">Your website/internal</div>
        <SelectField
          label="Publish on website"
          name="publishOnWeb"
          watch={watch}
          setValue={setValue}
          options={publishOnWebsiteOptions}
          register={register}
          error={errors.publishOnWeb?.message?.toString()}
          onChange={(value: string) => {
            setValue('publishOnWeb', value);
            clearErrors('publishOnWeb');
          }}
        />
        <SelectField
          label="Status"
          name="status"
          watch={watch}
          setValue={setValue}
          options={statusOptions}
          register={register}
          error={errors.status?.message?.toString()}
          onChange={(value: string) => {
            setValue('status', value);
            clearErrors('status');
          }}
        />
        <InputField
          setValue={setValue}
          label="Detail page URL"
          name="detailPageUrl"
          register={register}
          error={errors.detailPageUrl?.message?.toString()}
        />
        <SelectField
          label="Publish on portals"
          name="publishOnPortals"
          watch={watch}
          setValue={setValue}
          options={publishOnPortalsOptions}
          register={register}
          error={errors.publishOnPortals?.message?.toString()}
          onChange={(value: string) => {
            setValue('publishOnPortals', value);
            clearErrors('publishOnPortals');
          }}
        />


<SelectField
          label="Portal Status"
          name="portalStatus"
          watch={watch}
          setValue={setValue}
          options={portalStatusOptions}
          register={register}
          error={errors.publishOnPortals?.message?.toString()}
          onChange={(value: string) => {
            setValue('portalStatus', value);
            clearErrors('portalStatus');
          }}
        />
        <SelectField
          label="For"
          name="forA"
          watch={watch}
          setValue={setValue}
          options={forOptions}
          register={register}
          error={errors.forA?.message?.toString()}
          onChange={(value: string) => {
            setValue('forA', value);
            clearErrors('forA');
          }}
        />
        <SelectField
          label="Property Type"
          name="propertyTypeA"
          watch={watch}
          setValue={setValue}
          options={propertyTypeOptions}
          register={register}
          error={errors.propertyType?.message?.toString()}
          onChange={(value: string) => {
            setValue('propertyTypeA', value);
            clearErrors('propertyTypeA');
          }}
        />
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="newHome"
            name="newHome"
            {...register('newHome')}
            
            onChange={(e) => setValue('newHome', e.target.checked)}
          />
          <label htmlFor="newHome" className="ml-2">New home</label>
        </div>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="offPlan"
            name="offPlan"
            {...register('offPlan')}

            onChange={(e) => setValue('offPlan', e.target.checked)}
          />
          <label htmlFor="offPlan" className="ml-2">Off plan</label>
        </div>
        <SelectField
          label="Virtual Tour 1"
          name="virtualTour"
          watch={watch}
          setValue={setValue}
          options={virtualTourOptions}
          register={register}
          error={errors.virtualTour?.message?.toString()}
          onChange={(value: string) => {
            setValue('virtualTour', value);
            clearErrors('virtualTour');
          }}
        />
        <InputField
          setValue={setValue}
          label="Virtual Tour 1 URL"
          name="enterUrl"
          register={register}
          error={errors.enterUrl?.message?.toString()}
        />
        <SelectField
          label="Virtual Tour 2"
          name="virtualTour2"
          watch={watch}
          setValue={setValue}
          options={virtualTourOptions}
          register={register}
          error={errors.virtualTour2?.message?.toString()}
          onChange={(value: string) => {
            setValue('virtualTour2', value);
            clearErrors('virtualTour2');
          }}
        />
        <InputField
          setValue={setValue}
          label="Virtual Tour 2 URL"
          name="enterUrl2"
          register={register}
          error={errors.enterUrl2?.message?.toString()}
        />
      </div>

      {/* Property Details Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium underline p-5">Property Details</div>
        <InputField
          setValue={setValue}
          label="Property Brochure URL"
          name="propertyBrochureUrl"
          register={register}
          error={errors.propertyBrochureUrl?.message?.toString()}
        />
        <TextAreaField
          label="Admin fee(s)"
          name="AdminFee"
          register={register}
          error={errors.AdminFee?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Service Charges"
          name="ServiceCharges"
          register={register}
          error={errors.ServiceCharges?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Minimum term for let"
          name="minimumTermForLet"
          register={register}
          error={errors.minimumTermForLet?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Annual ground rent"
          name="annualGroundRent"
          register={register}
          error={errors.annualGroundRent?.message?.toString()}
        />
        <InputField
          setValue={setValue}
          label="Length of lease"
          name="lengthOfLease"
          register={register}
          error={errors.lengthOfLease?.message?.toString()}
        />
      </div>

      {/* Portal Descriptions Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium underline p-5">Portal Descriptions</div>
        <TextAreaField
          label="Short summary for portals (0/300 characters recommended)"
          name="shortSummaryForPortals"
          register={register}
          error={errors.shortSummaryForPortals?.message?.toString()}
        />
        <TextAreaField
          label="Full description for portals"
          name="fullDescriptionforPortals"
          register={register}
          error={errors.fullDescriptionforPortals?.message?.toString()}
        />
      </div>

      {/* Additional Options Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium underline p-5">Additional Options</div>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="sendToBoomin"
            name="sendToBoomin"
            {...register('sendToBoomin')}

            onChange={(e) => setValue('sendToBoomin', e.target.checked)}
          />
          <label htmlFor="sendToBoomin" className="ml-2">Send to Boomin</label>
        </div>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="sendToRightmoveNow"
            name="sendToRightmoveNow"
            {...register('sendToRightmoveNow')}
            onChange={(e) => setValue('sendToRightmoveNow', e.target.checked)}
          />
          <label htmlFor="sendToRightmoveNow" className="ml-2">Send to Rightmove now</label>
        </div>
        <InputField
          setValue={setValue}
          label="Custom display address"
          name="CustomDisplayAddress"
          register={register}
          error={errors.CustomDisplayAddress?.message?.toString()}
        />
        <SelectField
          label="Transaction Type"
          name="transactionType"
          watch={watch}
          setValue={setValue}
          options={transactionTypeOptions}
          register={register}
          error={errors.transactionType?.message?.toString()}
          onChange={(value: string) => {
            setValue('transactionType', value);
            clearErrors('transactionType');
          }}
        />
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="sendToOnTheMarket"
            name="sendToOnTheMarket"
            {...register('sendToOnTheMarket')}
            onChange={(e) => setValue('sendToOnTheMarket', e.target.checked)}
          />
          <label htmlFor="sendToOnTheMarket" className="ml-2">Send to On The Market</label>
        </div>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="newsAndExclusive"
            name="newsAndExclusive"
            
            {...register('newsAndExclusive')}
            onChange={(e) => setValue('newsAndExclusive', e.target.checked)}
          />
          <label htmlFor="newsAndExclusive" className="ml-2">News and Exclusive</label>
        </div>
      </div>

      {/* Select Portals Section */}
      <div className="p-4 w-full">
        <div className="text-lg font-medium underline p-5">Select Portals</div>
        <div className="grid">
       
<FeatureSelection
            features={portalList}
            register={register}
            name={"selectPortals"}
            setValue={setValue}
            error={errors.portalList?.message?.toString()}
            selectedFeatures={[]}
            watch={watch}
            label={"Portal List"} 
    />

        </div>
      </div>
    </div>
  );
};

export default Publish;
