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

const VendorPdf = ({ vendor }) => {
  const [open, setOpen] = useState(false);

  const sections = [
    {
      title: "Personal Information",
      fields: [
        { label: "Type", value: vendor.type },
        { label: "Title", value: vendor.title },
        { label: "First Name", value: vendor.firstName },
        { label: "Last Name", value: vendor.lastName },
        { label: "Company", value: vendor.company },
        { label: "Salutation", value: vendor.salutation },
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
        { label: "Phone (Home)", value: vendor.phoneHome },
        { label: "Phone (Work)", value: vendor.phoneWork },
        { label: "Phone (Mobile)", value: vendor.phoneMobile },
        { label: "Email", value: vendor.email },
        { label: "Website", value: vendor.website },
        { label: "Fax", value: vendor.fax },
        { label: "Pager", value: vendor.pager },
      ]
    },
    {
      title: "Personal Details",
      fields: [
        { label: "Birthplace", value: vendor.birthplace },
        { label: "Nationality", value: vendor.nationality },
        { label: "Passport Number", value: vendor.passportNumber },
      ]
    },
    {
      title: "Business Information",
      fields: [
        { label: "Status", value: vendor.status },
        { label: "Branch", value: vendor.branch },
        { label: "Source", value: vendor.source },
        { label: "Negotiator", value: vendor.negotiator },
        { label: "VAT Number", value: vendor.vatNumber },
      ]
    },
    {
      title: "Fees & Financial Details",
      fields: [
        { label: "Sales Fee", value: vendor.salesFee },
        { label: "Management Fee", value: vendor.managementFee },
        { label: "Finders Fee", value: vendor.findersFee },
        { label: "Sales Fee (A)", value: vendor.salesFeeA },
        { label: "Management Fee (A)", value: vendor.managementFeeA },
        { label: "Finders Fee (A)", value: vendor.findersFeeA },
        { label: "NRL Tax", value: vendor.nrlTax },
        { label: "NRL Reference", value: vendor.nrlRef },
        { label: "NRL Rate", value: vendor.nrlRate },
      ]
    },
    {
      title: "Bank Details",
      fields: [
        { label: "Bank Name", value: vendor.bankBody },
        { label: "Bank Address Line 1", value: vendor.bankAddressLine1 },
        { label: "Bank Address Line 2", value: vendor.bankAddressLine2 },
        { label: "Bank Town", value: vendor.bankTown },
        { label: "Bank Post Code", value: vendor.bankPostCode },
        { label: "Bank Country", value: vendor.bankCountry },
        { label: "IBAN", value: vendor.bankIban },
        { label: "BIC", value: vendor.bic },
        { label: "NIB", value: vendor.nib },
      ]
    },
    {
      title: "Additional Information",
      fields: [
        { label: "Comments", value: vendor.comments },
        { label: "Other Info", value: vendor.otherInfo },
        { label: "Label", value: vendor.label },
        { label: "Landlord Full Name", value: vendor.landlordFullName },
        { label: "Landlord Contact", value: vendor.landlordContact },
      ]
    }
  ];

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="px-6 py-4">
            <DialogTitle className="text-2xl font-bold">
              {vendor.firstName} {vendor.lastName} - Vendor Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 pb-6">
            <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary sticky top-0  py-2">
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
                    {index < sections.length - 1 && (
                      <Separator className="my-4" />
                    )}
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

export default VendorPdf;