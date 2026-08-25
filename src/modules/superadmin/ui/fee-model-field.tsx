'use client';

import { Controller, type Control } from 'react-hook-form';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import type { UpdateOrganizationInput } from '@/modules/superadmin/schemas';

export function FeeModelField({
  id,
  control,
}: {
  id: string;
  control: Control<UpdateOrganizationInput>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Fee model</Label>
      <Controller
        control={control}
        name="feeModel"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger
              id={id}
              className="border-border text-ink focus-visible:border-gold focus-visible:ring-gold/30 h-9 w-full rounded-lg border bg-white px-2.5 text-[13.5px] outline-none focus-visible:ring-2"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default — $7.99 floor, then 8%</SelectItem>
              <SelectItem value="gmo">GMO — flat 18%, no floor</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <p className="text-fa-muted text-xs leading-relaxed">
        Applies to class entry fees only. Add-ons, qualifying fees and vendor booths always take a
        flat 8% regardless of this setting.
      </p>
    </div>
  );
}
