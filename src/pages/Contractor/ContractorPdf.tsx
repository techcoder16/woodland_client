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

const ContractorPdf = ({ contractor, open: openProp, onOpenChange, hideTrigger }: any) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = onOpenChange || setOpenState;

  const sections = [
    {
      title: "Company Information",
      fields: [
        { label: "Name", value: contractor.name },
        { label: "Specialty", value: contractor.specialty },
      ]
    },
    {
      title: "Contact Details",
      fields: [
        { label: "Phone", value: contractor.phone },
        { label: "Email", value: contractor.email },
      ]
    },
    {
      title: "Address",
      fields: [
        { label: "Post Code", value: contractor.postCode },
        { label: "Address Line 1", value: contractor.addressLine1 },
        { label: "Address Line 2", value: contractor.addressLine2 },
        { label: "Town", value: contractor.town },
        { label: "Country", value: contractor.country },
        { label: "Address (legacy)", value: contractor.addressLine1 ? undefined : contractor.address },
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
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {contractor.logo && (
                <img src={contractor.logo} alt="" className="h-10 w-10 rounded-full object-cover" />
              )}
              {contractor.name} - Contractor Details
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
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContractorPdf;
