import { Badge } from '@/shared/ui/shadcn/badge';

/** "Rated" (official / qualifying score) vs "Not rated" (schooling) — the same
 * level can be offered both ways, so this sits next to every class name and
 * every cart line. */
export function RatedBadge({ rated }: { rated: boolean }) {
  return rated ? (
    <Badge className="border-[#C9A227] bg-[#F6EDD2] text-[#7A5B0E] hover:bg-[#F6EDD2]">Rated</Badge>
  ) : (
    <Badge variant="outline" className="text-fa-muted border-[#DED9C9] bg-white">
      Not rated
    </Badge>
  );
}
