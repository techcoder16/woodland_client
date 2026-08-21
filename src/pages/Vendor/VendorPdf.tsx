import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const VendorPdf = ({ vendor, open: openProp, onOpenChange, hideTrigger }: any) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = onOpenChange || setOpenState;

  const properties = vendor?.property || [];

  const sections = [
    {
      title: "Personal Information",
      fields: [
        { label: "First Name", value: vendor.firstName },
        { label: "Last Name", value: vendor.lastName },
      ]
    },
    {
      title: "Contact Details",
      fields: [
        { label: "Address Line 1", value: vendor.addressLine1 },
        { label: "Address Line 2", value: vendor.addressLine2 },
        { label: "Town", value: vendor.town },
        { label: "Post Code", value: vendor.postCode },
        { label: "Country", value: vendor.country },
        { label: "Phone", value: vendor.phone },
        { label: "Email", value: vendor.email },
      ]
    },
    {
      title: "Bank Details",
      fields: [
        { label: "Bank Name", value: vendor.bankName },
        { label: "Account Number", value: vendor.bankAccountNo },
        { label: "Sort Code", value: vendor.bankSortCode },
        { label: "Bank Address Line 1", value: vendor.bankAddressLine1 },
        { label: "Bank Address Line 2", value: vendor.bankAddressLine2 },
        { label: "Bank Town", value: vendor.bankTown },
        { label: "Bank Post Code", value: vendor.bankPostCode },
        { label: "Bank Country", value: vendor.bankCountry },
      ]
    },
  ];

  return (
    <>
      {!hideTrigger && (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted"
          onClick={() => setOpen(true)}
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="px-6 py-4">
            <DialogTitle className="text-2xl font-bold">
              {vendor.firstName} {vendor.lastName} - Landlord Details
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6">
            <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary py-2">
                      {section.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.fields.map((field, fieldIndex) => (
                        field.value && (
                          <div key={fieldIndex} className="space-y-1  p-3 rounded-md">
                            <p className="text-sm font-medium text-muted-foreground">
                              {field.label}
                            </p>
                            <p className="text-sm">
                              {typeof field.value === 'boolean'
                                ? field.value ? 'Yes' : 'No'
                                : field.value.toString()}
                            </p>
                          </div>
                        )
                      ))}
                    </div>
                    <Separator className="my-4" />
                  </div>
                ))}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary py-2">
                    Linked Properties
                  </h3>
                  {properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {properties.map((property: any) => (
                        <div key={property.id} className="space-y-1 p-3 rounded-md border">
                          <p className="text-sm">{property.addressLine1}</p>
                          {property.addressLine2 && <p className="text-sm">{property.addressLine2}</p>}
                          <p className="text-sm text-muted-foreground">
                            {property.town} {property.postCode}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No properties linked.</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorPdf;
