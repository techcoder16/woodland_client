import { isCountryUnlocked } from "@/lib/countrySetting";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import InputField from "../../utils/InputField";
import SelectField from "@/utils/SelectedField";

interface TenantProps {
  register: any;
  watch: any;
  clearErrors: any;
  setValue: any;
  errors: any;
  type?: string;
  isEdit?: boolean;
}

// Occupier form. One field for each of phone and email, with a "+" to add more.
// The first phone is MobileNo and extra phones are joined into HomePhone; Email is
// the login and extra emails are joined into Email2 (same ", " convention as the
// landlord form, so no schema change is needed). At least one
// contact number or email is required (see tenant.schema.ts). No address;
// country is always stored as GB.
const SEP = ", ";
const split = (v?: string | null) => (v || "").split(",").map((x) => x.trim()).filter(Boolean);

const Tenant = ({ register, watch, clearErrors, setValue, errors, isEdit }: TenantProps) => {
  const [phones, setPhones] = useState<string[]>(() => {
    const initial = [...split(watch("MobileNo")), ...split(watch("HomePhone"))];
    return initial.length ? initial : [""];
  });
  const [emails, setEmails] = useState<string[]>(() => split(watch("Email2")));

  const updatePhones = (next: string[]) => {
    setPhones(next);
    const clean = next.map((p) => p.trim()).filter(Boolean);
    setValue("MobileNo", clean[0] ?? "", { shouldDirty: true });
    setValue("HomePhone", clean.slice(1).join(SEP), { shouldDirty: true });
    clearErrors("MobileNo");
  };
  const updateEmails = (next: string[]) => {
    setEmails(next);
    setValue("Email2", next.map((e) => e.trim()).filter(Boolean).join(SEP), { shouldDirty: true });
    clearErrors("Email2");
  };

  useEffect(() => {
    if (!isCountryUnlocked() && watch("country") !== "GB") setValue("country", "GB");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleOptions = [
    { value: "mr", label: "Mr" },
    { value: "mrs", label: "Mrs" },
    { value: "miss", label: "Miss" },
    { value: "ms", label: "Ms" },
    { value: "dr", label: "Dr" },
  ];

  const contactError = errors?.MobileNo?.message?.toString();

  return (
    <div className="w-full space-y-5">
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Occupier details</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <SelectField
          label="Title"
          name="title"
          watch={watch}
          setValue={setValue}
          options={titleOptions}
          register={register}
          error={errors.title?.message?.toString()}
          onChange={(value) => clearErrors("title")}
        />
        <InputField setValue={setValue} label="First Name" name="FirstName" register={register} error={errors?.FirstName?.message?.toString()} />
        <InputField setValue={setValue} label="Last Name" name="SureName" register={register} error={errors?.SureName?.message?.toString()} />
      </div>

      <div className="space-y-4 pt-2">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Contact</div>
        <p className="text-xs text-muted-foreground">Enter at least one contact number or email.</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-medium text-sm">Contact Number</label>
            {phones.map((phone, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input type="tel" value={phone} placeholder={i === 0 ? "Contact number" : "Additional number"} onChange={(e) => updatePhones(phones.map((p, j) => (j === i ? e.target.value : p)))} />
                {phones.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove number" onClick={() => updatePhones(phones.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="border-primary text-primary" onClick={() => updatePhones([...phones, ""])}>
              <Plus className="mr-1 h-4 w-4" /> Add number
            </Button>
            {contactError && <p className="text-destructive text-xs">{contactError}</p>}
          </div>

          <div className="space-y-1.5">
            {isEdit ? (
              <>
                <label className="text-muted-foreground font-medium text-sm">Email</label>
                <div className="text-sm py-2">{watch("Email") || "-"}</div>
                <p className="text-xs text-muted-foreground">This email is the occupier's login and can't be changed here.</p>
              </>
            ) : (
              <InputField setValue={setValue} label="Email" name="Email" type="email" register={register} error={errors?.Email?.message?.toString()} />
            )}
            {emails.map((email, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input type="email" value={email} placeholder="Additional email" onChange={(e) => updateEmails(emails.map((x, j) => (j === i ? e.target.value : x)))} />
                <Button type="button" variant="ghost" size="icon" aria-label="Remove email" onClick={() => updateEmails(emails.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="border-primary text-primary" onClick={() => updateEmails([...emails, ""])}>
              <Plus className="mr-1 h-4 w-4" /> Add email
            </Button>
            {errors?.Email2?.message && <p className="text-destructive text-xs">{errors.Email2.message.toString()}</p>}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Tenant;
