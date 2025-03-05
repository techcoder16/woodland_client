import React, { useState, useEffect } from "react";
import { FieldValues, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

interface FeatureSelectionProps {
    features: string[];
    register: UseFormRegister<FieldValues>;
    setValue: UseFormSetValue<FieldValues>;
    watch: UseFormWatch<FieldValues>; // Added watch
    selectedFeatures: string[];
    setSelectedFeatures: (features: string[]) => void;
}

const FeatureSelection: React.FC<FeatureSelectionProps> = ({
    features,
    register,
    setValue,
    watch,
    selectedFeatures,
    setSelectedFeatures,
}) => {
    const [filteredFeatures, setFilteredFeatures] = useState<string[]>(features);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const updatedFeatures = features.filter(
            (feature) => typeof feature === "string" && feature.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredFeatures(updatedFeatures);
    }, [searchTerm, features]);

    // Watching the "features" field in react-hook-form
    const watchedFeatures = watch("features", selectedFeatures);

    useEffect(() => {
        setSelectedFeatures(watchedFeatures || []);
    }, [watchedFeatures]);

    const handleFeatureToggle = (feature: string) => {
        let updatedFeatures;
        if (watchedFeatures.includes(feature)) {
            updatedFeatures = watchedFeatures.filter((f) => f !== feature);
        } else {
            updatedFeatures = [...watchedFeatures, feature];
        }
        setSelectedFeatures(updatedFeatures);
        setValue("features", updatedFeatures);
    };

    return (
        <div className="p-4 border rounded-md shadow-md">
            <input
                name="search"
                className="p-2 border border-gray-300 rounded lg:flex-grow"
                placeholder="Search features..."
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="mt-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                {filteredFeatures.map((feature) => (
                    <label key={feature} className="flex items-center space-x-2 p-2">
                        <input
                            type="checkbox"
                            checked={watchedFeatures.includes(feature)} // Using watched state
                            onChange={() => handleFeatureToggle(feature)}
                        />
                        <span>{feature}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default React.memo(FeatureSelection);
