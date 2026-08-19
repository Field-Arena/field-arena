import type { ReactElement } from 'react';
import { HorseShowManagementSoftware } from '@/modules/marketing/content/guides/horse-show-management-software';
import { EquestrianEventManagementSoftware } from '@/modules/marketing/content/guides/equestrian-event-management-software';
import { HorseShowScoringSoftware } from '@/modules/marketing/content/guides/horse-show-scoring-software';
import { BuildAHorseShowIn10Minutes } from '@/modules/marketing/content/guides/build-a-horse-show-in-10-minutes';
import { EventingAndCombinedTrainingSoftware } from '@/modules/marketing/content/guides/eventing-and-combined-training-software';
import { RegistrationToResultsSoftware } from '@/modules/marketing/content/guides/registration-to-results-software';
import { HorseShowSecretarySoftware } from '@/modules/marketing/content/guides/horse-show-secretary-software';
import { DressageShowSoftware } from '@/modules/marketing/content/guides/dressage-show-software';
import { HorseShowManagementSoftwareForUsdfGmos } from '@/modules/marketing/content/guides/horse-show-management-software-for-usdf-gmos';

export const GUIDE_SLUGS = [
  'horse-show-management-software',
  'equestrian-event-management-software',
  'horse-show-scoring-software',
  'build-a-horse-show-in-10-minutes',
  'eventing-and-combined-training-software',
  'registration-to-results-software',
  'horse-show-secretary-software',
  'dressage-show-software',
  'horse-show-management-software-for-usdf-gmos',
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

interface Guide {
  slug: GuideSlug;
  tag: string;
  cardTitle: string;
  cardDescription: string;
  Body: () => ReactElement;
}

/**
 * The guide catalogue: metadata for the Learning Center index plus the body
 * component each guide route renders. Adding a guide means adding both a body
 * component under `content/guides/` and one entry here.
 */
export const GUIDES: Guide[] = [
  {
    slug: 'horse-show-management-software',
    tag: 'Overview',
    cardTitle: 'Horse Show Management Software: The Complete Guide',
    cardDescription:
      'What horse show management software actually does — setup, entries, scheduling, scoring, volunteers, and vendors — and how to choose the right platform.',
    Body: HorseShowManagementSoftware,
  },
  {
    slug: 'equestrian-event-management-software',
    tag: 'Overview',
    cardTitle: 'What Is Equestrian Event Management Software?',
    cardDescription:
      'Why horse shows need software built for the sport, not generic event tools — and what that looks like in practice.',
    Body: EquestrianEventManagementSoftware,
  },
  {
    slug: 'horse-show-scoring-software',
    tag: 'Scoring',
    cardTitle: 'Horse Show Scoring Software',
    cardDescription:
      'How digital scoring replaces paper score sheets and manual calculations — and what it means for judges, secretaries, and competitors.',
    Body: HorseShowScoringSoftware,
  },
  {
    slug: 'build-a-horse-show-in-10-minutes',
    tag: 'Getting started',
    cardTitle: 'How to Build a Horse Show in 10 Minutes',
    cardDescription:
      'The five-step process for setting up a complete show — event details, classes, registration, schedule, and scoring — fast.',
    Body: BuildAHorseShowIn10Minutes,
  },
  {
    slug: 'eventing-and-combined-training-software',
    tag: 'Eventing',
    cardTitle: 'Eventing and Combined Training Software',
    cardDescription:
      'Managing multi-phase competitions — dressage, cross-country, and stadium jumping — without losing track of a single score.',
    Body: EventingAndCombinedTrainingSoftware,
  },
  {
    slug: 'registration-to-results-software',
    tag: 'Overview',
    cardTitle: 'Registration to Results: The Complete Turnkey System',
    cardDescription:
      'Why every handoff between registration, scoring, and results creates risk — and what a single connected workflow looks like.',
    Body: RegistrationToResultsSoftware,
  },
  {
    slug: 'horse-show-secretary-software',
    tag: 'Show secretaries',
    cardTitle: 'Horse Show Secretary Software',
    cardDescription:
      'Everything a show secretary needs in one place — show setup, entries, office management, scoring, and communication.',
    Body: HorseShowSecretarySoftware,
  },
  {
    slug: 'dressage-show-software',
    tag: 'Dressage',
    cardTitle: 'Dressage Show Software',
    cardDescription:
      'Ride times, judges, score sheets, and percentages — built around how dressage shows and USDF GMOs actually run.',
    Body: DressageShowSoftware,
  },
  {
    slug: 'horse-show-management-software-for-usdf-gmos',
    tag: 'USDF GMOs',
    cardTitle: 'Horse Show Management Software for USDF GMOs',
    cardDescription:
      'Reducing office labor for board members, show secretaries, volunteers, vendors, and sponsors — all in one platform.',
    Body: HorseShowManagementSoftwareForUsdfGmos,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
