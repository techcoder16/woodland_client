import { Plus, Trash2 } from 'lucide-react';
import InputField from '../../utils/InputField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Extra = { bankName?: string; accountName?: string; sortCode?: string; accountNumber?: string };

// allowExtra (Add Landlord): more bank accounts can be added under the first one.
const BankDetails = ({ register, setValue, watch, errors, allowExtra = false }: any) => {
  const extras: Extra[] = (allowExtra && watch?.('extraBankAccounts')) || [];
  const setExtras = (next: Extra[]) => setValue('extraBankAccounts', next, { shouldDirty: true });
  const update = (i: number, key: keyof Extra, value: string) => setExtras(extras.map((e, j) => (j === i ? { ...e, [key]: value } : e)));

  return (
    <div className="w-full">
      <div className="p-4 w-full">
        <div className="text-lg font-medium flex justify-start underline p-5">Bank details</div>
        <p className="px-5 pb-3 text-sm text-muted-foreground">The first account is the landlord's default.{allowExtra ? ' Use "Add another bank account" for more.' : ''}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField setValue={setValue} label="Bank Name" name="bankBankName" register={register} error={errors.bankBankName?.message?.toString()} />
          {/* Stored in bankName — the label is "Account Name" (the account holder's name). */}
          <InputField setValue={setValue} label="Account Name" name="bankName" register={register} error={errors.bankName?.message?.toString()} />
          <InputField setValue={setValue} label="Account Number" name="bankAccountNo" register={register} error={errors.bankAccountNo?.message?.toString()} />
          <InputField setValue={setValue} label="Sort Code" name="bankSortCode" register={register} error={errors.bankSortCode?.message?.toString()} />
        </div>

        {allowExtra && (
          <div className="mt-6 space-y-4">
            {extras.map((e, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">Bank account {i + 2}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-600" title="Remove" onClick={() => setExtras(extras.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Bank Name</Label><Input value={e.bankName || ''} onChange={(ev) => update(i, 'bankName', ev.target.value)} /></div>
                  <div className="space-y-1"><Label>Account Name</Label><Input value={e.accountName || ''} onChange={(ev) => update(i, 'accountName', ev.target.value)} /></div>
                  <div className="space-y-1"><Label>Account Number</Label><Input value={e.accountNumber || ''} onChange={(ev) => update(i, 'accountNumber', ev.target.value)} /></div>
                  <div className="space-y-1"><Label>Sort Code</Label><Input value={e.sortCode || ''} onChange={(ev) => update(i, 'sortCode', ev.target.value)} /></div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setExtras([...extras, {}])}>
              <Plus className="h-4 w-4 mr-2" /> Add another bank account
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankDetails;
