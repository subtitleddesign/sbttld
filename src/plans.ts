import type { PlanId } from './types';

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  video: boolean;
  audio: boolean;
  adSizes: boolean;
  maxSavedDesigns: number;
}

// Prices are placeholders: set real ones in Stripe.
export const PLANS: Record<PlanId, Plan> = {
  essentials: {
    id: 'essentials',
    name: 'Essentials',
    price: '£49/mo',
    video: false,
    audio: false,
    adSizes: false,
    maxSavedDesigns: 25,
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    price: '£249/mo',
    video: true,
    audio: true,
    adSizes: true,
    maxSavedDesigns: Infinity,
  },
};
