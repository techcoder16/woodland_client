  import React, { useCallback, useEffect, useState } from 'react';
  import InputField from '../../utils/InputField';
  import SelectField from '../../utils/SelectedField';
  import countriesData from '../../data/counteries.json';
  import getApi from '@/helper/getApi';

  import { fetchVendors, deleteVendor } from "@/redux/dataStore/vendorSlice";
  import { useDispatch, useSelector } from "react-redux";

  import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks"; // ✅ Use typed hooks
import InputSelect from '@/utils/InputSelect';
import FeatureSelection from '@/utils/FeatureSelection';
import { RegisterOptions, FieldValues, UseFormRegisterReturn } from 'react-hook-form';
import TextAreaField from '@/utils/TextAreaField';



  const PropertyInfo = ({ register,watch, clearErrors, setValue, errors,type}: any) => {

    const [selectedType, setSelectedType] = useState('');
    const [selectedTitle, setSelectedTitle] = useState('');
    const [selectedSalutation, setSelectedSalutation] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [acceptLHA, setAcceptLHA] = useState('');
    const dispatch = useAppDispatch(); // ✅ Use typed dispatch
    const { vendors, totalPages, loading } = useAppSelector((state) => state.vendors);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);



    const [selectedVendor, setSelectedVendor] = useState("");



    

    useEffect(() => {
      dispatch(fetchVendors({ page: currentPage, search: searchTerm }));
      
    }, [dispatch, currentPage, searchTerm]);

  const vendorOptions = vendors?.map((vendor: any) => ({
    
      value: vendor.id, // Assuming vendors have an 'id' field
      label: vendor.firstName, // Assuming vendors have a 'name' field
    }));

    const handleSelectChange = useCallback((name: string, value: string) => {
  
      if (name === "vendor") setSelectedVendor(value);
      setValue(name, value);
      clearErrors(name);
    }, [setValue, clearErrors]);
  

    const salutationOptions = [
      { value: 'firstName', label: 'First Name' },
      { value: 'lastName', label: 'Last Name' },
      { value: 'fullName', label: 'Full Name' },
      { value: 'company', label: 'Company' },
      { value: 'companyTitleFullName', label: 'Company + Title + Full Name' },
    ];

    const forOptions = [
      { value: 'sale', label: 'Sale' },
      { value: 'let', label: 'Let' },
    
    ];
  

    const typeOptions = [
      { value: 'Company', label: 'Company' },
      { value: 'Individual', label: 'Individual' },
    ];

    const categoryOptions = [
      { value: 'commercial', label: 'Commercial' },
      { value: 'residential', label: 'Residential' },
    ];

    const propertyTypeOptions = [
      { value: 'Apartment', label: 'Apartment' },
      { value: 'Flat', label: 'Flat' },
      { value: 'House', label: 'House' },
    ];

    const priceQualifierOptions = [
    
      { value: 'POA', label: 'POA' },
      { value: 'Asking price', label: 'Asking Price' },
      { value: 'Guide price', label: 'Guide Price' },
      { value: 'Fixed price', label: 'Fixed Price' },
      { value: 'OIRO', label: 'OIRO' },
      { value: 'OIEO', label: 'OIEO' },
      { value: 'Offers over', label: 'Offers Over' },
      { value: 'Sale by Tender', label: 'Sale by Tender' },
      { value: 'From', label: 'From' },
      { value: 'Shared Ownership', label: 'Shared Ownership' },
      { value: 'Or Nearest Offer', label: 'Or Nearest Offer' },
      { value: 'Rent', label: 'Rent' },
      { value: 'Rent from', label: 'Rent From' },
      { value: 'Offers Invited', label: 'Offers Invited' },
      { value: 'Coming Soon', label: 'Coming Soon' },
      { value: 'Inclusive of Rates', label: 'Inclusive of Rates' },
      { value: 'All Inclusive', label: 'All Inclusive' },
    ];

    const features = [
      "Guest cloakroom" ,
      "Gym" ,
      "Video Entry" ,
      "Un-Furnished" ,
      "Mezzanine" ,
      "Swimming Pool" ,
      "River view" ,
      "Shops and amenities nearby" ,
      "Air Conditioning" ,
      "Fully Furnished" ,
      "Fitted Kitchen" ,
      "En suite"
    ];

    
    const [search, setSearch] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);


    const [isAddingArea, setIsAddingArea] = useState(false);
    const tenureOptions = [
      { value: 'Freehold', label: 'Freehold' },
      { value: 'Leasehold', label: 'Leasehold' },
      { value: 'Share of Freehold', label: 'Share of Freehold' },
      { value: 'Virtual Freehold', label: 'Virtual Freehold' },
      { value: 'Other', label: 'Other' },
    ];

    const meetingsOptions = [
      { value: '0', label: '0' },
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' },
      { value: '7', label: '7' },
      { value: '8', label: '8' },
      { value: '9', label: '9' },
      { value: '10', label: '10' },
      { value: '11', label: '11' },
      { value: '12', label: '12' },
      { value: '13', label: '13' },
      { value: '14', label: '14' },
      { value: '15', label: '15' },
    ];
    
    const areaOptions = [

      { value: '44', label: '34' },
      { value: '45', label: '9' },
      { value: '31', label: 'Acton' },
      { value: '12', label: 'Barking' },
      { value: '35', label: 'Barkingside' },
      { value: '67', label: 'Basildon' },
      { value: '8', label: 'Beckton' },
      { value: '79', label: 'Belvedere' },
      { value: '62', label: 'Benfleet' },
      { value: '85', label: 'Bexley' },
      { value: '29', label: 'Bow' },
      { value: '64', label: 'Brentwood' },
      { value: '70', label: 'Bromley' },
      { value: '61', label: 'Buckhurst Hill' },
      { value: '15', label: 'Canning Town' },
      { value: '74', label: 'Canvey Island' },
      { value: '27', label: 'Chadwell Heath' },
      { value: '73', label: 'Chatham' },
      { value: '9', label: 'Chigwell' },
      { value: '19', label: 'Chingford' },
      { value: '13', label: 'Clayhall' },
      { value: '52', label: 'Croydon' },
      { value: '4', label: 'Dagenham' },
      { value: '80', label: 'Dartford' },
      { value: '6', label: 'East Ham' },
      { value: '39', label: 'Enfield' },
      { value: '48', label: 'Erith' },
      { value: '55', label: 'Feltham' },
      { value: '14', label: 'Forest Gate' },
      { value: '3', label: 'Gants Hill' },
      { value: '81', label: 'Gillingham' },
      { value: '32', label: 'Goodmayes' },
      { value: '54', label: 'Gravesend' },
      { value: '36', label: 'Grays' },
      { value: '24', label: 'Hackney' },
      { value: '42', label: 'Hainault' },
      { value: '5', label: 'Hainult' },
      { value: '38', label: 'Harlow' },
      { value: '43', label: 'Harrow' },
      { value: '84', label: 'Hoddesdon' },
      { value: '17', label: 'Hornchurch' },
      { value: '71', label: 'Hounslow' },
      { value: '1', label: 'Ilford' },
      { value: '25', label: 'Leyton' },
      { value: '23', label: 'Leytonstone' },
      { value: '34', label: 'London' },
      { value: '59', label: 'Loughton' },
      { value: '51', label: 'Luton' },
      { value: '7', label: 'Manor Park' },
      { value: '33', label: 'Mile End' },
      { value: '50', label: 'Mitcham' },
      { value: '72', label: 'New Malden' },
      { value: '2', label: 'Newbury Park' },
      { value: '82', label: 'Northolt' },
      { value: '87', label: 'Orpington' },
      { value: '10', label: 'Plaistow' },
      { value: '28', label: 'Poplar' },
      { value: '77', label: 'Potters Bar' },
      { value: '53', label: 'Purfleet' },
      { value: '49', label: 'Rainham' },
      { value: '75', label: 'Ramsgate' },
      { value: '16', label: 'Redbridge' },
      { value: '78', label: 'Rochester' },
      { value: '83', label: 'Rochford' },
      { value: '22', label: 'Romford' },
      { value: '20', label: 'Seven Kings' },
      { value: '56', label: 'Shanklin' },
      { value: '60', label: 'Sidcup' },
      { value: '30', label: 'Silvertown' },
      { value: '47', label: 'South Croydon' },
      { value: '41', label: 'South Ockendon' },
      { value: '40', label: 'Southend-on-Sea' },
      { value: '69', label: 'Staines-upon-Thames' },
      { value: '18', label: 'Stratford' },
      { value: '68', label: 'Tilbury' },
      { value: '46', label: 'Upminster' },
      { value: '26', label: 'Upton Park' },
      { value: '86', label: 'Uxbridge' },
      { value: '76', label: 'Waltham Abbey' },
      { value: '21', label: 'Walthamstow' },
      { value: '57', label: 'Walton On The Naze' },
      { value: '63', label: 'Welling' },
      { value: '65', label: 'Welwyn Garden City' },
      { value: '58', label: 'West Molesey' },
      { value: '66', label: 'Westcliff-On-Sea' },
      { value: '11', label: 'Woodford' },
      { value: '37', label: 'Woodford Green' },
    ];
    

    const contractOptions = [
      { value: 'Sole Agency', label: 'Sole Agency' },
      { value: 'Multiple Agency', label: 'Multi Agency' },
    ];
    
    
    const development = [
      { value: 'No Development', label: 'No Development' },
      
    ];
    
const priceOptions = [
  {
    value:"£",label:"£"
  }
];
const feeOptions = [
  { label: "%", value: "%" },
  { label: "Fixed", value: "fixed" },
];
    useEffect(() => {
      console.log("Selected Vendor:", watch("vendor"));
    }, [watch("vendor")]);
    
    // const handleSelectChange = (name: string, value: string) => {
    //   // Update corresponding state based on the name of the select field
    //   if (name === 'type') setSelectedType(value);
    //   if (name === 'title') setSelectedTitle(value);
    //   if (name === 'salutation') setSelectedSalutation(value);
    //   // if (name === 'country'  && type!="edit") setSelectedCountry(value);
    //   if (name === 'acceptLHA') setAcceptLHA(value);

    //   // Use setValue to update the form field value and clear any previous errors
    //   setValue(name, value); // Update the form field value
    //   clearErrors(name); // Clear any validation errors for the field

    //   // Optionally, log or do other side effects here
      
    // };

    return (
      <div className="w-full">
        {/* Personal Information Section */}
        <div className="p-4 w-full">

        <SelectField
  label="Vendor"
  name="vendor"
  watch={watch}
  setValue={setValue}
  options={vendorOptions}
  register={register}
  error={errors.vendor?.message?.toString()}
  onChange={(value) => handleSelectChange("vendor", value)} // Ensure onChange is correctly set
/>
</div>
<div className="p-4 w-full">



          <div className="text-lg font-medium flex justify-start underline p-5">Propery on market</div>
          <hr></hr>




          <SelectField
            label="For"
            name="for"
  watch={watch}
            
            setValue={setValue}
            
            options={forOptions}
            register={register}
            error={errors.for?.message?.toString()}
            onChange={(value) => handleSelectChange('for', value)} // Added onChange
          />

<SelectField
            label="Category"
            name="category"
  watch={watch}
            
            setValue={setValue}
            
            options={categoryOptions}
            register={register}
            error={errors.category?.message?.toString()}
            onChange={(value) => handleSelectChange('category', value)} // Added onChange
          />


<SelectField
            label="Property Type"
            name="propertyType"
  watch={watch}
            
            setValue={setValue}
            
            options={forOptions}
            register={register}
            error={errors.propertyType?.message?.toString()}
            onChange={(value) => handleSelectChange('propertyType', value)} // Added onChange
          />



<InputField setValue={setValue}  label="Internal reference" name="internalReference" register={register} error={errors.internalReference?.message?.toString()} />
     
     

     </div>
     <div className="p-4 w-full">

<div className="text-lg font-medium flex justify-start underline p-5">Price and contract</div>
         
<InputSelect
      setValue={setValue}
      
        label="Price"
        name="price"
        watch={watch}
        
        options={priceOptions}
        register={register}
      />



  




<SelectField
            label="Price qualifier"
            name="priceQualifier"
  watch={watch}
            
            setValue={setValue}
            
            options={priceQualifierOptions}
            register={register}
            error={errors.priceQualifier?.message?.toString()}
            onChange={(value) => handleSelectChange('priceQualifier', value)} // Added onChange
          />



<SelectField
            label="Tenure"
            name="tenure"
  watch={watch}
            
            setValue={setValue}
            
            options={tenureOptions}
            register={register}
            error={errors.tenure?.message?.toString()}
            onChange={(value) => handleSelectChange('tenure', value)} // Added onChange
          />




<SelectField
            label="Contract type"
            name="contractType"
  watch={watch}
            
            setValue={setValue}
            
            options={contractOptions}
            register={register}
            error={errors.contractType?.message?.toString()}
            onChange={(value) => handleSelectChange('contractType', value)} // Added onChange
          />


<InputSelect
      setValue={setValue}
      
        label="Sales Fee"
        name="salesFee"
        watch={watch}
        
        options={feeOptions}
        register={register}
      />

     
<div className="text-lg font-medium flex justify-start underline p-5">Address of property on market</div>
         

<InputField setValue={setValue}  label="Post Code" name="postCode" register={register} error={errors.postCode?.message?.toString()} />
     
<InputField setValue={setValue}  label="Property No" name="propertyNo" register={register} error={errors.propertyNo?.message?.toString()} />
     
     
<InputField setValue={setValue}  label="Property Name" name="propertyName" register={register} error={errors.propertyName?.message?.toString()} />
     
<InputField setValue={setValue} label="Address Line 1" name="addressLine1" register={register} error={errors.addressLine1?.message?.toString()} />
       <InputField setValue={setValue} label="Address Line 2" name="addressLine2" register={register} error={errors.addressLine2?.message?.toString()} />
   
       
       {!isAddingArea ? (
  <SelectField
    label="Town/Area"
    name="town"
    watch={watch}
    setValue={setValue}
    options={areaOptions}
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





          <InputField setValue={setValue}  label="County" name="county" register={register} error={errors.county?.message?.toString()} />
          <SelectField
          label="Country"
          setValue={setValue}
          
          watch={watch}
          
          
          name="country"
          options={countriesData}
          register={register}
          error={errors.country?.message?.toString()}
          onChange={(value) => handleSelectChange('country', value)} // Added onChange
        />
        
        
<InputField setValue={setValue} label="Latitude" name="latitude" register={register} error={errors.latitude?.message?.toString()} />
        
        <InputField setValue={setValue} label="Longitude" name="longitude" register={register} error={errors.longitude?.message?.toString()} />
                
        
                
        <SelectField
                    label="Development"
                    setValue={setValue}
                    
                    watch={watch}
                    
                    
                    name="development"
                    options={development}
                    register={register}
                    error={errors.development?.message?.toString()}
                    onChange={(value) => handleSelectChange('development', value)} // Added onChange
                  />


          
        <InputField placeholder="e.g 1990" setValue={setValue} label="Year of build" name="yearOfBuild" register={register} error={errors.yearOfBuild?.message?.toString()} />
            

 </div>


<div className="p-4 w-full">

          
<div className="text-lg font-medium flex justify-start underline p-5">Composition</div>
         

<InputField placeholder="" setValue={setValue} label="Parking" name="parking" register={register} error={errors.parking?.message?.toString()} />
            



<SelectField
          label="Garden"
          name="garden"
          watch={watch}
          
          setValue={setValue}
          
          options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]}
          register={register}
          error={errors.garden?.message?.toString()}
          onChange={(value) => handleSelectChange('garden', value)} // Added onChange
        />
        

        <InputField placeholder="0.0 sqft" setValue={setValue} label="Living/Floor space (sqm) (sqm)" name="livingFloorSpace" register={register} error={errors.livingFloorSpace?.message?.toString()} />
  

        
        <SelectField
                    label="Meeting rooms"
                    setValue={setValue}
                    
                    watch={watch}
                    
                    
                    name="meetingRooms"
                    options={meetingsOptions}
                    register={register}
                    error={errors.meetingRooms?.message?.toString()}
                    onChange={(value) => handleSelectChange('meetingRooms', value)} // Added onChange
                  />

                   
        <SelectField
                    label="Work Stations"
                    setValue={setValue}
                    
                    watch={watch}
                    
                    
                    name="workStation"
                    options={meetingsOptions}
                    register={register}
                    error={errors.workStation?.message?.toString()}
                    onChange={(value) => handleSelectChange('workStation', value)} // Added onChange
                  />

<InputField placeholder="Acres: 0.25 - 0.50 - 0.75 - 1 - 1.25 - 1.50 - 1.75 - 2 - 5 - 10 - 20 - 50- Specify" setValue={setValue} label="Land-size (sqm)" name="landSize" register={register} error={errors.landSize?.message?.toString()} />
  
<SelectField
                    label="Outbuildings"
                    setValue={setValue}
                    
                    watch={watch}
                    
                    
                    name="outBuildings"
                    options={meetingsOptions}
                    register={register}
                    error={errors.outBuildings?.message?.toString()}
                    onChange={(value) => handleSelectChange('outBuildings', value)} // Added onChange
                  />

<FeatureSelection
      features={features} 
      register={register} 
      setValue={setValue} 
      selectedFeatures={[]} 
      watch={watch}

      setSelectedFeatures={(features) => features} // Handle selected features
      
    />
       <TextAreaField
        label="Tags"
        name="tags"
        register={register}
        error={errors.Tags?.message?.toString()}
      />

        <hr />

     
  </div>
      </div>
    );
  };

  export default PropertyInfo;
