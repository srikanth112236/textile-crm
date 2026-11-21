/**
 * Server-side feature flags for API behaviour that must be gated independently
 * of the storefront bundle (bulk import, Instagram media resolution, etc.).
 *
 * Accepts both `FF_*` and `NEXT_PUBLIC_FF_*` names so a single Render env var
 * can control frontend and backend during rollout. Default is OFF.
 */

export const SERVER_FEATURE_FLAGS = {
  NEW_AUTH: ['FF_NEW_AUTH', 'NEXT_PUBLIC_FF_NEW_AUTH'],
  STAFF_GUARD: ['FF_STAFF_GUARD', 'NEXT_PUBLIC_FF_STAFF_GUARD'],
  BULK_IMPORT: ['FF_BULK_IMPORT', 'NEXT_PUBLIC_FF_BULK_IMPORT'],
  IG_REELS: ['FF_IG_REELS', 'NEXT_PUBLIC_FF_IG_REELS'],
  NEW_HOME: ['FF_NEW_HOME', 'NEXT_PUBLIC_FF_NEW_HOME'],
  NEW_FILTERS: ['FF_NEW_FILTERS', 'NEXT_PUBLIC_FF_NEW_FILTERS'],
} as const;

export type ServerFeatureFlag = keyof typeof SERVER_FEATURE_FLAGS;

function parseFlag(value: string | undefined): boolean {
  if (!value) return false;
  return ['1', 'true', 'on', 'yes', 'enabled'].includes(value.trim().toLowerCase());
}

export function isServerFeatureEnabled(flag: ServerFeatureFlag): boolean {
  const names = SERVER_FEATURE_FLAGS[flag];
  for (const name of names) {
    if (parseFlag(process.env[name])) return true;
  }
  return false;
}

export function getServerFeatureFlags(): Record<ServerFeatureFlag, boolean> {
  return Object.fromEntries(
    (Object.keys(SERVER_FEATURE_FLAGS) as ServerFeatureFlag[]).map((flag) => [
      flag,
      isServerFeatureEnabled(flag),
    ])
  ) as Record<ServerFeatureFlag, boolean>;
}
