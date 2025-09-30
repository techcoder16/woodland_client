import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InputField from "@/utils/InputField";
import FileUploadField from "@/utils/FileUploadField";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import { toast } from "sonner";
import getApi from "@/helper/getApi";
import SelectField from "@/utils/SelectedField";
import { post } from "@/helper/api";
import { TOWN_AREA } from "@/lib/constant";

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
    a => (typeof a === "string" && a.trim() !== "" ? parseFloat(a) : undefined),
    z.number().optional()
  ),
  HowDeattached: z.string().optional(),
  Floor: z.string().optional(),
  DoorNumber: z.string().optional(),
  Road: z.string().optional(),
  towns: z.string().optional(),
  NoOfBaths: z.string().optional(),

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
    clearErrors, // ✅ Add this

    formState: { errors: errorsFeature },
  } = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
  });
  const postCodeValue = watch("PostCode");

  // Always set propertyId in the form.
  useEffect(() => {
    if (property?.id) {
      setFeatureValue("propertyId", property.id);
      console.log("Property ID set:", property.id);
    }
  }, [setFeatureValue, property]);

  const handleSelectChange = (name: keyof FeatureFormData, value: string) => {
    // Update corresponding state based on the name of the select field

    setFeatureValue(name, value);
    clearErrors(name);
  };
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
        const params = `?propertyId=${property.id}`;
        const response = await getApi(`property-management/feature`, params, headers);
        console.log(response);
        const data: any = response;
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
    data &&
      Object.entries(data).forEach(([key, value]) => {
        if (key === "map" && value) {
          // If value is a FileList or array, append each file.
          console.log(key);
          value.forEach((file: any, index) => {
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
      "Content-Type": "application/json",
    };
    console.log(formData);
    const res = await post("property-management/feature/upsert", data, headers);
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
            <SelectField
              label="Carpeting"
              name="Carpeting"
              register={registerFeature}
              error={errorsFeature.Carpeting?.message}
              watch={watch}
              options={[
                { label: "Wooden Floor", value: "Wooden-Floor" },
                { label: "Fully Carpeted", value: "Fully-Carpeted" },
                { label: "Partialy Carpeted", value: "Partly-Carpeted" },
                { label: "Partialy Wooden Floor ", value: "Partialy-Wooden-Floor" },
              ]}
              onChange={value => handleSelectChange("Carpeting", value)}
              setValue={setFeatureValue}
            />
            <SelectField
              label="Number of Beds"
              name="noOfDeds"
              options={[
                { label: "Not Available", value: "Not-Available" },

                { label: "Box Room", value: "Box-Room" },

                { label: "Single Room", value: "Single-Room" },
                { label: "Double Room", value: "Double-Room" },
                { label: "Studio", value: "Studio" },

                { label: "One", value: "One" },

                { label: "One-Two", value: "One-Two" },

                { label: "Two", value: "Two" },
                { label: "Two-Three", value: "Two-Three" },

                { label: "Three", value: "Three" },
                { label: "Three-Four", value: "Three-Four" },

                { label: "Four", value: "Four" },
                { label: "Four-Five", value: "Four-Five" },

                { label: "Five", value: "Five" },
                { label: "Five-Six", value: "Five-Six" },

                { label: "Six", value: "Six" },

                { label: "Six-Seven", value: "Six-Seven" },
                { label: "Seven", value: "Seven" },
                { label: "Eight", value: "Eight" },
                { label: "Nine", value: "Nine" },
                { label: "Ten", value: "Ten" },
              ]}
              register={registerFeature}
              error={errorsFeature.noOfDeds?.message}
              watch={watch}
              setValue={setFeatureValue}
              onChange={value => handleSelectChange("noOfDeds", value)}
            />

            <SelectField
              label="Number of WC/Showers"
              name="NoOfWC"
              register={registerFeature}
              error={errorsFeature.NoOfWC?.message}
              setValue={setFeatureValue}
              watch={watch}
              options={[
                { label: "One", value: "One" },
                { label: "Two", value: "Two" },
                { label: "Three", value: "Three" },
                { label: "Four", value: "Four" },
                { label: "Five", value: "Five" },
                { label: "Six", value: "Six" },
                { label: "Seven", value: "Seven" },
                { label: "Eight", value: "Eight" },
                { label: "Nine", value: "Nine" },
                { label: "Ten", value: "Ten" },
              ]}
              onChange={value => handleSelectChange("NoOfWC", value)}
            />
          </div>{" "}
          <div className=" grid  grid-cols-3">
            <SelectField
              watch={watch}
              label="Number of Receptions"
              name="NoOfReceptions"
              options={[
                { label: "Not Available", value: "Not-Available" },

                { label: "One", value: "One" },
                { label: "Two", value: "Two" },
                { label: "Three", value: "Three" },
                { label: "Four", value: "Four" },
                { label: "Through Lounge", value: "Though-Lounge" },
              ]}
              register={registerFeature}
              error={errorsFeature.NoOfReceptions?.message}
              setValue={setFeatureValue}
              onChange={value => handleSelectChange("NoOfReceptions", value)}
            />

            <SelectField
              label="Number of Cloak Rooms"
              name="NoOfCookRooms"
              register={registerFeature}
              error={errorsFeature.NoOfCookRooms?.message}
              watch={watch}
              options={[
                { label: "One", value: "One" },
                { label: "Two", value: "Two" },
                { label: "Three", value: "Three" },
                { label: "Four", value: "Four" },
                { label: "Five", value: "Five" },

                { label: "Six", value: "Six" },
                { label: "Seven", value: "Seven" },
                { label: "Eight", value: "Eight" },
                { label: "Nine", value: "Nine" },
                { label: "Ten", value: "Ten" },
              ]}
              onChange={value => handleSelectChange("NoOfCookRooms", value)}
              setValue={setFeatureValue}
            />

            <SelectField
              watch={watch}
              label="Garden"
              name="Garden"
              options={[
                { value: "Not Available", label: "Not-Available" },

                { value: "Small", label: "Small" },
                { value: "Medium", label: "Medium" },
                { value: "Large", label: "Large" },
              ]}
              register={registerFeature}
              error={errorsFeature.Garden?.message}
              setValue={setFeatureValue}
              onChange={value => handleSelectChange("Garden", value)}
            />
          </div>{" "}
          <div className=" grid  grid-cols-3">
            <SelectField
              watch={watch}
              label="Gas Central Heating"
              name="GasControlMeeting"
              register={registerFeature}
              options={[
                { label: "Fully Tested", value: "Fully-Tested" },
                { label: "Un Tested", value: "Un-Tested" },
                { label: "Not Available", value: "Not-Available" },
                { label: "Available", value: "Available" },
              ]}
              error={errorsFeature.GasControlMeeting?.message}
              setValue={setFeatureValue}
              onChange={value => handleSelectChange("GasControlMeeting", value)}
            />
            <div className="flex col-span-2">
              <InputField
                label="Post Code"
                name="PostCode"
                register={registerFeature}
                error={errorsFeature.PostCode?.message}
                placeholder="Enter PostCode details"
                setValue={setFeatureValue}
              />

              {postCodeValue?.trim() && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          postCodeValue
                        )}`,
                        "_blank"
                      )
                    }
                  >
                    Show Map
                  </Button>
                </div>
              )}

              <SelectField
                label="Town"
                name="towns"
                watch={watch}
                options={TOWN_AREA}
                register={registerFeature}
                error={errorsFeature.towns?.message}
                onChange={value => {
                  handleSelectChange("towns", value);
                }}
                setValue={setFeatureValue}
              />
            </div>

            <SelectField
              label="Double Glazing"
              name="DoubleGazing"
              register={registerFeature}
              error={errorsFeature.DoubleGazing?.message}
              watch={watch}
              options={[
                { label: "Fully Double Glazed", value: "Fully-Double-Glazed" },
                { label: "Partialy Double Glazed", value: "Partly-Double-Gazed" },
                { label: "Not Available", value: "Not-Available" },
              ]}
              setValue={setFeatureValue}
              onChange={value => handleSelectChange("DoubleGazing", value)}
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
            <InputField
              label="Road"
              name="Road"
              register={registerFeature}
              error={errorsFeature.Road?.message}
              placeholder="Enter road"
              setValue={setFeatureValue}
            />
          </div>
          <div className=" grid  grid-cols-3">
            <SelectField
              watch={watch}
              label="Garage"
              name="Garage"
              register={registerFeature}
              error={errorsFeature.Garage?.message}
              options={[
                { label: "Front Garage", value: "Front-Garage" },
                { label: "Rear Garage", value: "Rear-Garage" },
                { label: "Not Available", value: "Not-Available" },
              ]}
              onChange={value => handleSelectChange("Garage", value)}
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
            <SelectField
              label="Type"
              name="featureType"
              register={registerFeature}
              error={errorsFeature.featureType?.message}
              options={[
                { label: "Flat", value: "Flat" },
                { label: "House", value: "House" },
                { label: "Bungalow", value: "Bungalow" },

                { label: "Room", value: "Room" },
                { label: "Commercial Plot", value: "Commercial-Plot" },
                { label: "Residential Plot", value: "Residental-Plot" },
                { label: "Ware House", value: "Ware-House" },
                { label: "Shop", value: "Shop" },
              ]}
              watch={watch}
              onChange={value => handleSelectChange("featureType", value)}
              setValue={setFeatureValue}
            />
          </div>{" "}
          <div className=" grid  grid-cols-3">
            <SelectField
              label="How Deattached"
              name="HowDeattached"
              register={registerFeature}
              error={errorsFeature.HowDeattached?.message}
              options={[
                { value: "Detached", label: "Detached" },
                { label: "Semi Detached", value: "Semi-Detached" },
                { value: "Terraced", label: "Terraced" },
                { label: "End of Terrace", value: "End-of-Terrace" },
              ]}
              watch={watch}
              setValue={setFeatureValue}
              onChange={value => handleSelectChange("HowDeattached", value)}
            />
            <SelectField
              label="Floor"
              name="Floor"
              register={registerFeature}
              error={errorsFeature.Floor?.message}
              watch={watch}
              options={[
                { value: "Ground", label: "Ground" },
                { value: "First", label: "First" },
                { value: "Second", label: "Second" },
                { value: "Third", label: "Third" },
                { value: "Fourth", label: "Fourth" },
                { value: "Maisonette", label: "Maisonette" },
                { value: "Basement", label: "Basement" },
              ]}
              setValue={setFeatureValue}
              onChange={value => handleSelectChange("Floor", value)}
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
          <SelectField
            label="Number of Baths"
            name="NoOfBaths"
            register={registerFeature}
            error={errorsFeature.NoOfBaths?.message}
            setValue={setFeatureValue}
            watch={watch}
            options={[
              { label: "One", value: "One" },
              { label: "Two", value: "Two" },
              { label: "Three", value: "Three" },
              { label: "Four", value: "Four" },
              { label: "Five", value: "Five" },
              { label: "Six", value: "Six" },
              { label: "Seven", value: "Seven" },
              { label: "Eight", value: "Eight" },
              { label: "Nine", value: "Nine" },
              { label: "Ten", value: "Ten" },
            ]}
            onChange={value => handleSelectChange("NoOfBaths", value)}
          />
          <Button type="submit">Update Feature</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Feature;
