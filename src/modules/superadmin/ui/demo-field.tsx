import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { FIELD, LABEL } from '@/modules/superadmin/ui/signup-preview-styles';

export function DemoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className={LABEL}>{label}</Label>
      <Input className={FIELD} value={value} readOnly />
    </div>
  );
}
