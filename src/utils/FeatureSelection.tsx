import React, { useState, useEffect } from "react";
import { FieldValues, UseFormRegister, UseFormSetValue } from "react-hook-form";
import InputField from "./InputField";

interface FeatureSelectionProps {
    features: string[];
    register: UseFormRegister<FieldValues>;
    setValue: UseFormSetValue<FieldValues>;
    selectedFeatures: string[];
    setSelectedFeatures: (features: string[]) => void;
}

const FeatureSelection: React.FC<FeatureSelectionProps> = ({
    features,
    register,
    setValue,
    selectedFeatures,
    setSelectedFeatures,
}) => {

    let [filteredFeatures, setFilteredFeatures] = useState<any>(features);
    const [searchTerm, setSearchTerm] = useState("");
    useEffect(() => {
        filteredFeatures = features
            .filter((feature) => typeof feature === "string") // Ensure it's a string
            .filter((feature) =>
                feature.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [searchTerm]);


    const handleFeatureToggle = (feature: string) => {
        let updatedFeatures: any;
        if (selectedFeatures.includes(feature)) {
            updatedFeatures = selectedFeatures.filter((f) => f !== feature);
        } else {
            updatedFeatures = [...selectedFeatures, feature];
        }
        setSelectedFeatures(updatedFeatures);
        setValue("features", updatedFeatures);
    };

    return (
        <div className="p-4 border rounded-md shadow-md">
            <InputField
                label="Search Features"
                name="search"
                register={register}

                setValue={setValue}
                placeholder="Search features..."
                onChange={setSearchTerm}
            />
            <div className="mt-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                {filteredFeatures && filteredFeatures.map((feature) => (
                    <label key={feature} className="flex items-center space-x-2 p-2">
                        <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                        />
                        <span>{feature}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default FeatureSelection;
