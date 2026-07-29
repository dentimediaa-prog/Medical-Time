"use strict";

/* ==========================================================================
   ROLE MANAGEMENT
   ==========================================================================
   This module owns "what a signed-in user is allowed to do," which is a
   separate concern from authentication (auth.js only proves *who* they
   are). Roles are now sourced from the real `profiles` table via
   profileService.js — resolveRole() is the one place that happens, so it
   was the only thing that changed when the mock was replaced; every
   caller (app.js, nav config below) was already written against this
   same { id, email, name, role } shape and needed no changes.
   ========================================================================== */

const ROLES = Object.freeze({
  ADMIN: "admin",
  EMPLOYEE: "employee",
});

/**
 * Resolves the application role/profile for a signed-in Supabase auth user
 * by loading their row from `profiles` (see
 * supabase/migrations/001_schema.sql).
 *
 * Falls back to a least-privilege (employee) profile — never to admin — if
 * the row can't be loaded (e.g. the handle_new_user trigger hasn't run yet,
 * or a transient network error), so a lookup failure can never grant
 * elevated access. The failure is logged so it's visible during setup.
 *
 * @param {{id?: string, email?: string}} authUser - the Supabase auth user
 * @returns {Promise<{id: string, email: string, name: string, role: string}>}
 */
async function resolveRole(authUser) {
  if (!authUser || !authUser.id) {
    return { id: null, email: "", name: "", role: ROLES.EMPLOYEE };
  }

  try {
    const { data, error } = await window.ProfileService.getProfileById(authUser.id);

    if (error || !data) {
      console.warn(
        "[roles] No profile row found for this user — defaulting to the " +
          "'employee' role. Make sure the handle_new_user trigger from " +
          "002_rls_policies.sql ran for this account.",
        error
      );
      return {
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.email || "",
        role: ROLES.EMPLOYEE,
      };
    }

    return {
      id: data.id,
      email: data.email || authUser.email || "",
      name: data.full_name || authUser.email || "",
      role: data.role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.EMPLOYEE,
    };
  } catch (err) {
    console.error("[roles] Failed to load profile — defaulting to 'employee'.", err);
    return {
      id: authUser.id,
      email: authUser.email || "",
      name: authUser.email || "",
      role: ROLES.EMPLOYEE,
    };
  }
}

function isAdmin(user) {
  return !!user && user.role === ROLES.ADMIN;
}

function isEmployee(user) {
  return !!user && user.role === ROLES.EMPLOYEE;
}

function hasRole(user, role) {
  return !!user && user.role === role;
}

/* ==========================================================================
   ROLE-BASED NAVIGATION (Phase 2 — completion)
   ==========================================================================
   Centralizes which sidebar destinations, and therefore which of the
   existing #view-* sections, each role may reach. Both configs point at
   the same existing view ids/renderers in app.js — no new pages are
   created here, only which ones are reachable and how they're labeled.
   ========================================================================== */

const NAV_BY_ROLE = Object.freeze({
  [ROLES.ADMIN]: [
    { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
    { id: "team", label: "Employees", icon: "users" },
    { id: "attendance", label: "Attendance", icon: "user-check" },
    { id: "schedule", label: "Schedule", icon: "calendar-days" },
    { id: "leave", label: "Leave Requests", icon: "calendar-clock" },
    { id: "reports", label: "Reports", icon: "bar-chart-3" },
    { id: "settings", label: "Settings", icon: "settings" },
  ],
  [ROLES.EMPLOYEE]: [
    { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
    { id: "time", label: "My Time", icon: "clock" },
    { id: "attendance", label: "Attendance", icon: "user-check" },
    { id: "leave", label: "My Leave", icon: "calendar-clock" },
    { id: "reports", label: "My Reports", icon: "bar-chart-3" },
    { id: "settings", label: "Profile", icon: "settings" },
  ],
});

const DEFAULT_VIEW_ID = "dashboard";

/** Returns the ordered list of { id, label, icon } nav entries a role may see. */
function getNavForRole(role) {
  return NAV_BY_ROLE[role] || [];
}

/** True if the given view id is reachable by the given role. */
function isViewAllowedForRole(role, viewId) {
  return getNavForRole(role).some((item) => item.id === viewId);
}

/** The view every role should land on / be redirected to when in doubt. */
function getDefaultViewId() {
  return DEFAULT_VIEW_ID;
}

window.Roles = {
  ROLES,
  resolveRole,
  isAdmin,
  isEmployee,
  hasRole,
  getNavForRole,
  isViewAllowedForRole,
  getDefaultViewId,
};
