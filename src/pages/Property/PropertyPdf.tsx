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

const PropertyPdf = ({ property, open: openProp, onOpenChange, hideTrigger }: any) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = onOpenChange || setOpenState;

  const vendor = property?.vendor;

  const sections = [
    {
      title: "Property Details",
      fields: [
        { label: "Property Address", value: property.addressLine1 },
        { label: "Address Line 2", value: property.addressLine2 },
        { label: "Town", value: property.town },
        { label: "Post Code", value: property.postCode },
        { label: "Category", value: property.category },
        { label: "Bedrooms", value: property.bedrooms },
        { label: "Bathrooms", value: property.bathrooms },
        { label: "Receptions", value: property.receptions },
        { label: "Rent Per Month", value: property.price },
        { label: "Status", value: property.status },
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
              {property.addressLine1} - Property Details
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
                        field.value !== undefined && field.value !== null && field.value !== "" && (
                          <div key={fieldIndex} className="space-y-1 p-3 rounded-md">
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
                    Landlord
                  </h3>
                  {vendor ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1 p-3 rounded-md border">
                        <p className="text-sm">{vendor.firstName} {vendor.lastName}</p>
                        <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No landlord linked.</p>
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

export default PropertyPdf;
