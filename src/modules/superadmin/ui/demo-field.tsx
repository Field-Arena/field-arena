import { Input } from '@/shared/ui/shadcn/input';
import { FIELD, LABEL } from '@/modules/superadmin/ui/signup-preview-styles';

export function DemoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <Input className={FIELD} value={value} readOnly />
    </div>
  );
}
