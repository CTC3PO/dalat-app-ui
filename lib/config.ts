/**
 * Application configuration
 *
 * This file contains feature flags and settings that control app behavior.
 * Later, these can be moved to a database for dynamic/role-based control.
 */

export const config = {
  /**
   * Event slug editability setting
   *
   * Options:
   * - "create_only": Users can only set custom slug when creating an event
   * - "anytime": Users can edit the slug when creating or editing an event
   *
   * Note: Changing an existing event's slug will break any previously shared links.
   * Consider keeping "create_only" unless users understand this trade-off.
   *
   * Future: This could check user roles (e.g., admins can always edit)
   */
  slugEditability: "anytime" as "create_only" | "anytime",
} as const;

/**
 * Helper to check if slug editing is allowed for a given context
 *
 * @param isEditing - Whether we're editing an existing event (vs creating new)
 * @returns Whether slug editing should be enabled
 *
 * Future: Add userId param to check user roles from database
 */
export function canEditSlug(isEditing: boolean): boolean {
  if (config.slugEditability === "anytime") {
    return true;
  }
  // "create_only" - only allow editing when creating a new event
  return !isEditing;
}
