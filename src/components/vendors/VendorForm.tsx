
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

interface VendorFormProps {
  onSuccess?: () => void;
}

export function VendorForm({ onSuccess }: VendorFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Vendor added successfully!");
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="payment">Payment Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-red-100 text-red-600">
                    <Upload />
                  </AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm">Upload Photo</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name</Label>
                  <Input id="name" placeholder="Enter vendor name" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Vendor Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landlord">Landlord</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter vendor description" rows={3} />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => setActiveTab("contact")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Next: Contact Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter email address" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="Enter phone number" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="Enter address" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Enter city" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ca">California</SelectItem>
                      <SelectItem value="ny">New York</SelectItem>
                      <SelectItem value="tx">Texas</SelectItem>
                      <SelectItem value="fl">Florida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" placeholder="Enter ZIP code" />
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab("basic")}
                >
                  Previous: Basic Info
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setActiveTab("payment")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Next: Payment Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Bank Account (Optional)</Label>
                  <Input id="bankAccount" placeholder="Enter bank account number" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID (Optional)</Label>
                  <Input id="taxId" placeholder="Enter tax ID" />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Payment Notes</Label>
                  <Textarea id="notes" placeholder="Enter any payment notes" rows={3} />
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab("contact")}
                >
                  Previous: Contact Details
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? "Saving..." : "Save Vendor"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
