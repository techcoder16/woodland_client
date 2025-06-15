import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InputField from "@/utils/InputField";
import FileUploadField from "@/utils/FileUploadField";
import postApi from "@/helper/postApi";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import { toast } from "sonner";
import getApi from "@/helper/getApi";

const featureSchema = z.object({
  propertyId: z.string().min(1),
  featureType: z.string().optional(),
  
  PostCode: z.string().optional(),
  noOfDeds: z.string().optional(),
  NoOfWC: z.string().optional(),
  NoOfReceptions: z.string().optional(),
  NoOfCookRooms: z.string().optional(),
  Garden: z.string().optional(),
  Carpeting: z.string().optional(),
  GasControlMeeting: z.string().optional(),
  DoubleGazing: z.string().optional(),
  OffStreetParking: z.boolean().optional(),
  Garage: z.string().optional(),
  keyNumber: z.preprocess(
    (a) => (typeof a === "string" && a.trim() !== "" ? parseFloat(a) : undefined),
    z.number().optional()
  ),
  Type: z.string().optional(),
  HowDeattached: z.string().optional(),
  Floor: z.string().optional(),
  DoorNumber: z.string().optional(),
  Road: z.string().optional(),
  // map is an array of Base64 image strings
  map: z.any().optional(),
});

type FeatureFormData = z.infer<typeof featureSchema>;

export const Feature = ({ property }: any) => {
  // Initialize the form with zod validation.
  const {
    register: registerFeature,
    handleSubmit: handleSubmitFeature,
    reset: resetFeature,
    setValue: setFeatureValue,
    watch,
    formState: { errors: errorsFeature },
  } = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
  });

  // Always set propertyId in the form.
  useEffect(() => {
    if (property?.id) {
      setFeatureValue("propertyId", property.id);
      console.log("Property ID set:", property.id);
    }
  }, [setFeatureValue, property]);
console.log(errorsFeature);
  // Fetch existing features for this property and integrate them (if found).
  useEffect(() => {
    async function fetchFeature() {
      try {
        const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          };
          const params = `?propertyId=${property.id}`
        const response = await getApi(
          `manager/features`,params,
           headers 
        );
        console.log(response)
        const data:any = response;
        if (data?.features && data?.features.length > 0) {
          // Assuming only one feature per property, integrate the first feature.
          resetFeature(data.features[0]);
        }
      } catch (error) {
        console.error("Error fetching features:", error);
      }
    }
    if (property?.id) {
      fetchFeature();
    }
  }, [property?.id, resetFeature]);

  const onSubmitFeature = async (data: FeatureFormData) => {
    // Prepare a FormData object to support file uploads.
    const formData = new FormData();
    console.log("Submitting for propertyId:", property.id);

    // Loop over the data fields and append them to FormData.
    Object.entries(data).forEach(([key, value]) => {
      if (key === "map" && value) {
        // If value is a FileList or array, append each file.
        console.log(key)
        value.forEach((file:any,index) => {
            if (file) {
              formData.append(`map[${index}]`, file); // Append each file individually
            }
          });
      } else if (value !== undefined) {
        formData.append(key, value as string | Blob);
      }
    });

    const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const res = await postApi("manager/features/upsert", formData, headers);
    if (res) {
      toast.success("Feature created successfully");
    } else {
      toast.error("Error creating feature");
    }
  };

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Property Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitFeature(onSubmitFeature)} className="space-y-4">
          <div className=" grid  grid-cols-3">

          <InputField
            label="Feature Type"
            name="featureType"
            register={registerFeature}
            error={errorsFeature.featureType?.message}
            placeholder="Enter feature type"
            setValue={setFeatureValue}
          />
          <InputField
            label="Number of Deds"
            name="noOfDeds"
            type="number"
            register={registerFeature}
            error={errorsFeature.noOfDeds?.message}
            placeholder="Enter number of deds"
            setValue={setFeatureValue}
          />
            

          <InputField
            label="Number of WC"
            name="NoOfWC"
            type="number"
            register={registerFeature}
            error={errorsFeature.NoOfWC?.message}
            placeholder="Enter number of WC"
            setValue={setFeatureValue}
          />
          </div>          <div className=" grid  grid-cols-3">

          <InputField
            label="Number of Receptions"
            name="NoOfReceptions"
            type="number"
            register={registerFeature}
            error={errorsFeature.NoOfReceptions?.message}
            placeholder="Enter number of receptions"
            setValue={setFeatureValue}
          />
          
          <InputField
            label="Number of Cook Rooms"
            name="NoOfCookRooms"
            type="number"
            register={registerFeature}
            error={errorsFeature.NoOfCookRooms?.message}
            placeholder="Enter number of cook rooms"
            setValue={setFeatureValue}
          />
          <InputField
            label="Carpeting"
            name="Carpeting"
            register={registerFeature}
            error={errorsFeature.Carpeting?.message}
            placeholder="Enter carpeting details"
            setValue={setFeatureValue}
          />
                    </div>          <div className=" grid  grid-cols-3">

          <InputField
            label="Gas Control Meeting"
            name="GasControlMeeting"
            register={registerFeature}
            error={errorsFeature.GasControlMeeting?.message}
            placeholder="Enter gas control meeting details"
            setValue={setFeatureValue}
          />
          <InputField
            label="Double Glazing"
            name="DoubleGazing"
            register={registerFeature}
            error={errorsFeature.DoubleGazing?.message}
            placeholder="Enter double glazing details"
            setValue={setFeatureValue}
          />
           
          <InputField
            label="Off Street Parking"
            name="OffStreetParking"
            type="checkbox"
            register={registerFeature}
            error={errorsFeature.OffStreetParking?.message}
            placeholder="Off Street Parking"
            setValue={setFeatureValue}
          />
                    </div>          <div className=" grid  grid-cols-3">

          <InputField
            label="Garage"
            name="Garage"
            register={registerFeature}
            error={errorsFeature.Garage?.message}
            placeholder="Enter garage details"
            setValue={setFeatureValue}
          />
          
          <InputField
            label="Key Number"
            name="keyNumber"
            type="number"
            register={registerFeature}
            error={errorsFeature.keyNumber?.message}
            placeholder="Enter key number"
            setValue={setFeatureValue}
          />
          <InputField
            label="Type"
            name="Type"
            register={registerFeature}
            error={errorsFeature.Type?.message}
            placeholder="Enter type"
            setValue={setFeatureValue}
          />
          </div>          <div className=" grid  grid-cols-3">
      
          <InputField
            label="How Deattached"
            name="HowDeattached"
            register={registerFeature}
            error={errorsFeature.HowDeattached?.message}
            placeholder="Enter how deattached"
            setValue={setFeatureValue}
          />
          <InputField
            label="Floor"
            name="Floor"
            register={registerFeature}
            error={errorsFeature.Floor?.message}
            placeholder="Enter floor"
            setValue={setFeatureValue}
          />
          
          <InputField
            label="Door Number"
            name="DoorNumber"
            register={registerFeature}
            error={errorsFeature.DoorNumber?.message}
            placeholder="Enter door number"
            setValue={setFeatureValue}
          />
                    </div>      
          <InputField
            label="Road"
            name="Road"
            register={registerFeature}
            error={errorsFeature.Road?.message}
            placeholder="Enter road"
            setValue={setFeatureValue}
          />
        
          <FileUploadField
            label="Upload Images"
            name="map"
            accept="image/*"
            register={registerFeature}
            setValue={setFeatureValue}
            watch={watch}
            error={errorsFeature.map?.message?.toString()}
            multiple={true}
          />
          <Button type="submit">Update Feature</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Feature;
