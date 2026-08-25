'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightIcon, Loader2Icon, UploadIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import {
  CATALOG_DISCIPLINES,
  CATALOG_FAMILY_META,
  CATALOG_SCORE_TYPES,
  SHEET_FAMILIES,
} from '@/modules/superadmin/constants';
import { createSheetSchema, type CreateSheetInput } from '@/modules/superadmin/schemas';
import { useCreateScoringSheet } from '@/modules/superadmin/hooks/use-catalog-mutations';
import { FormField } from '@/modules/superadmin/ui/organizer-form-field';

export function UploadSheetDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<CreateSheetInput>({
    resolver: zodResolver(createSheetSchema),
    defaultValues: {
      title: '',
      level: '',
      discipline: 'Dressage',
      family: 'movement',
      governingBody: 'USEF/USDF',
      sourceFile: '',
    },
  });

  const { mutate, isPending } = useCreateScoringSheet({
    onSuccess: (id) => {
      setOpen(false);
      form.reset();
      router.push(`/dashboard/superadmin/catalog/${id}`);
    },
  });

  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="bg-hunter-deep text-paper hover:bg-gold hover:text-hunter-deep inline-flex h-auto items-center gap-2 rounded-[9px] px-[18px] py-3 text-[13.5px] font-bold transition"
        >
          <UploadIcon className="size-[15px]" aria-hidden />
          Upload official sheet
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-nr)] text-[22px] font-medium text-[#16261F]">
            Upload an official sheet
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            Creates a catalog <strong className="text-[#16261F]">stub</strong> from the source
            sheet. You then tag its scoring family and scaffold the criteria the renderer reads. The
            file isn&apos;t stored in this build — only its name is captured.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              mutate(values);
            })(event);
          }}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              id="us-title"
              label="Sheet title"
              placeholder="e.g. First Level Test 4"
              error={errors.title}
              registration={form.register('title')}
            />
            <FormField
              id="us-level"
              label="Level"
              placeholder="e.g. First"
              error={errors.level}
              registration={form.register('level')}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="us-discipline">Discipline</Label>
              <Controller
                control={form.control}
                name="discipline"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="us-discipline" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATALOG_DISCIPLINES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="us-family">Scoring family</Label>
              <Controller
                control={form.control}
                name="family"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="us-family" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHEET_FAMILIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {CATALOG_FAMILY_META[f]?.label ?? f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="us-score">Score type</Label>
              <Controller
                control={form.control}
                name="governingBody"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="us-score" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATALOG_SCORE_TYPES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <FormField
            id="us-file"
            label="Source file name (optional)"
            placeholder="2023_First_Level_Test_4.pdf"
            error={errors.sourceFile}
            registration={form.register('sourceFile')}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <ArrowRightIcon className="size-[14px]" aria-hidden />
              )}
              {isPending ? 'Creating…' : 'Create stub & open'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
