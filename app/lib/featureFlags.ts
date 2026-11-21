/**
 * Typed feature flags.
 *
 * Flags are read from NEXT_PUBLIC_* env vars, so Next.js can inline them at
 * build time and both server and client components can use the same module.
 *
 * Default is OFF. The current behaviour stays untouched until a phase is
 * ready, then the flag can be enabled per environment. See `.env.example`.
 */

export const FEATURE_FLAGS = {
  NEW_AUTH: 'NEXT_PUBLIC_FF_NEW_AUTH',
  STAFF_GUARD: 'NEXT_PUBLIC_FF_STAFF_GUARD',
  BULK_IMPORT: 'NEXT_PUBLIC_FF_BULK_IMPORT',
  IG_REELS: 'NEXT_PUBLIC_FF_IG_REELS',
  NEW_HOME: 'NEXT_PUBLIC_FF_NEW_HOME',
  NEW_FILTERS: 'NEXT_PUBLIC_FF_NEW_FILTERS',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
export type FeatureFlagEnv = (typeof FEATURE_FLAGS)[FeatureFlag];

function parseFlag(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'on', 'yes', 'enabled'].includes(String(value).trim().toLowerCase());
}

// Keep every env access explicit: Next.js only inlines static property reads.
const VALUES: Readonly<Record<FeatureFlag, boolean>> = Object.freeze({
  NEW_AUTH: parseFlag(process.env.NEXT_PUBLIC_FF_NEW_AUTH),
  STAFF_GUARD: parseFlag(process.env.NEXT_PUBLIC_FF_STAFF_GUARD),
  BULK_IMPORT: parseFlag(process.env.NEXT_PUBLIC_FF_BULK_IMPORT),
  IG_REELS: parseFlag(process.env.NEXT_PUBLIC_FF_IG_REELS),
  NEW_HOME: parseFlag(process.env.NEXT_PUBLIC_FF_NEW_HOME),
  NEW_FILTERS: parseFlag(process.env.NEXT_PUBLIC_FF_NEW_FILTERS),
});

/** Read one flag. Safe in server components, client components and tests. */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return VALUES[flag] === true;
}

/** Read the full flag snapshot (useful for diagnostics/admin health pages). */
export function getFeatureFlags(): Readonly<Record<FeatureFlag, boolean>> {
  return VALUES;
}

/** The env variable name for a flag, for docs and diagnostics. */
export function featureFlagEnv(flag: FeatureFlag): FeatureFlagEnv {
  return FEATURE_FLAGS[flag];
}
