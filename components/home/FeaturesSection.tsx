'use client';

/**
 * FeaturesSection — thin wrapper that renders the bento layout.
 * The previous uniform 3×3 card grid lived here; it has been replaced
 * by `BentoFeatures` to give the section editorial rhythm and
 * differentiated tile treatment per capability.
 */

import { BentoFeatures } from './features/BentoFeatures';

export function FeaturesSection() {
  return <BentoFeatures />;
}
