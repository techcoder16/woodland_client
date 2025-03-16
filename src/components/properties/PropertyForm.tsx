
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building, 
  CalendarIcon, 
  CheckCircle2, 
  ChevronRight, 
  FileUp, 
  KeyRound, 
  MapPin, 
  Upload, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const propertyTypes = [
  "Residential - Apartment",
  "Residential - House",
  "Residential - Condo",
  "Commercial - Office",
  "Commercial - Retail",
  "Commercial - Industrial",
];

export function PropertyForm() {
  const [step, setStep] = useState(1);
  const [date, setDate] = React.useState<Date>();
  const navigate = useNavigate();

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      toast.success("Property added successfully!");
      navigate("/properties");
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Property</h1>
          <p className="text-muted-foreground">
            Enter property details to add a new listing
          </p>
        </div>
      </div>

      <div className="mb-8">
        <div className="relative after:absolute after:inset-x-0 after:top-[50%] after:block after:h-0.5 after:translate-y-[50%] after:rounded-lg after:bg-border">
          <ol className="relative z-10 flex justify-between">
            <StepIndicator 
              step={1} 
              currentStep={step} 
              title="Basic Info" 
              icon={Building} 
            />
            <StepIndicator 
              step={2} 
              currentStep={step} 
              title="Location" 
              icon={MapPin} 
            />
            <StepIndicator 
              step={3} 
              currentStep={step} 
              title="Details" 
              icon={KeyRound} 
            />
          </ol>
        </div>
      </div>

      <Card className="glass-card border">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details about the property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name</Label>
                <Input id="name" placeholder="Enter property name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Property Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter property description"
                  rows={4}
                />
              </div>
              
              <div>
                <Label className="mb-2 block">Property Image</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="property-image"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or WEBP (MAX. 2MB)
                      </p>
                    </div>
                    <Input
                      id="property-image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
              <CardDescription>
                Enter the address and location details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" placeholder="123 Main St" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" placeholder="State/Province" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip">Zip/Postal Code</Label>
                  <Input id="zip" placeholder="Zip/Postal Code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select defaultValue="US">
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Location Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special notes about the location"
                  rows={3}
                />
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>
                Enter additional details and specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" type="number" min="0" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" type="number" min="0" step="0.5" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area (sq ft)</Label>
                  <Input id="area" type="number" min="0" placeholder="0" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price/Rent</Label>
                  <Input id="price" type="number" min="0" placeholder="$0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Availability Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label className="mb-2 block">Documents</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="documents"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, XLS (MAX. 10MB)
                      </p>
                    </div>
                    <Input
                      id="documents"
                      type="file"
                      className="hidden"
                      multiple
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </>
        )}

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button type="button" onClick={nextStep}>
            {step === 3 ? "Submit" : "Next"}
            {step !== 3 && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StepIndicator({ step, currentStep, title, icon: Icon }: StepIndicatorProps) {
  const isCompleted = currentStep > step;
  const isCurrent = currentStep === step;

  return (
    <li className="flex flex-col items-center justify-center gap-2">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border-2 text-center text-sm font-medium",
          isCompleted && "bg-primary border-primary text-primary-foreground",
          isCurrent && "border-primary text-primary",
          !isCompleted && !isCurrent && "bg-background border-muted text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          isCurrent && "text-primary",
          isCompleted && "text-primary",
          !isCompleted && !isCurrent && "text-muted-foreground"
        )}
      >
        {title}
      </span>
    </li>
  );
}
