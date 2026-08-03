import type { SALE_TYPES, SALE_STATUSES } from './constants';

export type SaleType = (typeof SALE_TYPES)[number];
export type SaleStatus = (typeof SALE_STATUSES)[number];
