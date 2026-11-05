import type { Database } from '@/shared/types/database.types';

export type StaffProfile = Database['public']['Tables']['users']['Row'];
export type RiderProfile = Database['public']['Tables']['riders']['Row'];
