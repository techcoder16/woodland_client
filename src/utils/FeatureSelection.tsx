import React, { useState, useEffect, useRef } from "react";
import {
  FieldValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

interface FeatureSelectionProps {
  features: string[];
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  selectedFeatures: string[];
 
  name: string;
  label: string;
  error: string;
}

const FeatureSelection: React.FC<FeatureSelectionProps> = ({
  features,
  register,
  setValue,
  watch,
  selectedFeatures,
  name,
  error,
  label,
}) => {
  const [filteredFeatures, setFilteredFeatures] = useState<string[]>(features);
  const [searchTerm, setSearchTerm] = useState("");
  // A flag to ensure we split the value only once
  const didSplit = useRef(false);

  useEffect(() => {
    setFilteredFeatures(
      features.filter((feature) =>
        feature.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, features]);

  // Register the field with validation rules
  useEffect(() => {
    register(name, {
      required: "At least one feature must be selected",
      validate: (value) =>
        value.length > 0 ? true : "At least one feature must be selected",
    });
  }, [register, name]);

  const watchedFeatures = watch(name, selectedFeatures);

  // If the watched value is a single comma-separated string, split it only once.
  useEffect(() => {
    if (
      !didSplit.current &&
      watchedFeatures.length === 1 &&
      watchedFeatures[0].includes(",")
    ) {
      const updatedFeatures = watchedFeatures[0]
        .split(",")
        .map((feature) => feature.trim());
      didSplit.current = true;
      // Update the field value without triggering validations or marking it as dirty.
      setValue(name, updatedFeatures, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [watchedFeatures, name, setValue]);

  const handleFeatureToggle = (feature: string) => {
    const updatedFeatures = watchedFeatures.includes(feature)
      ? watchedFeatures.filter((f: string) => f !== feature)
      : [...watchedFeatures, feature];
    setValue(name, updatedFeatures);
  };

  const areAllFilteredSelected =
    filteredFeatures.length > 0 &&
    filteredFeatures.every((feature) => watchedFeatures.includes(feature));

  const handleSelectAllToggle = () => {
    const updatedFeatures = areAllFilteredSelected
      ? watchedFeatures.filter(
          (feature: string) => !filteredFeatures.includes(feature)
        )
      : Array.from(new Set([...watchedFeatures, ...filteredFeatures]));
    setValue(name, updatedFeatures);
  };

  return (
    <>
      <div className="p-4 border rounded-md shadow-md">
        <input
          name="search"
          className="p-2 border border-gray-300 rounded lg:flex-grow bg-transparent"
          placeholder={`Search ${label} ...`}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Hidden input to register the field */}
        <input type="hidden" {...register(name)} />

        <div className="mt-2">
          <label className="flex items-center space-x-2 p-2">
            <input
              type="checkbox"
              checked={areAllFilteredSelected}
              onChange={handleSelectAllToggle}
            />
            <span>Select All</span>
          </label>
        </div>

        <div className="mt-2 max-h-60 overflow-y-auto border p-2 rounded-md">
          {filteredFeatures.map((feature) => (
            <label key={feature} className="flex items-center space-x-2 p-2">
              <input
                type="checkbox"
                checked={watchedFeatures.includes(feature)}
                onChange={() => handleFeatureToggle(feature)}
              />
              <span>{feature}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}
    </>
  );
};

export default React.memo(FeatureSelection);
