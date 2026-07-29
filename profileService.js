"use strict";

/* ==========================================================================
   PROFILE SERVICE
   ==========================================================================
   The only module in the app that talks to the `profiles` table directly.
   Pure data access — no role interpretation, no UI. roles.js consumes this
   to answer "what can this user do", app.js never queries Supabase itself.

   Table shape (see supabase/migrations/001_schema.sql):
     profiles.id         uuid  PK, references auth.users(id)
     profiles.email      text
     profiles.full_name  text
     profiles.role       text  ('admin' | 'employee')
     profiles.created_at timestamptz
   ========================================================================== */

function getClient() {
  return window.Auth.getClient();
}

const ProfileService = {
  /**
   * Fetches the profiles row for a given auth user id.
   * Resolves to { data, error } — never throws for expected DB conditions
   * (missing row, RLS denial); only network-level failures reject.
   *
   * @param {string} userId - auth.users.id / profiles.id
   */
  async getProfileById(userId) {
    const client = getClient();
    return client
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("id", userId)
      .single();
  },

  /**
   * Updates fields on the current user's own profile (e.g. full_name).
   * RLS restricts this to the caller's own row — see 002_rls_policies.sql.
   *
   * @param {string} userId
   * @param {{full_name?: string}} updates
   */
  async updateOwnProfile(userId, updates) {
    const client = getClient();
    return client
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
  },
};

window.ProfileService = ProfileService;
