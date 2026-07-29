"use strict";

/* ==========================================================================
   SUPABASE CONFIG
   ==========================================================================
   Replace these two values with your own Supabase project's credentials
   (Project Settings → API in the Supabase dashboard).

   The anon/public key is safe to ship in client-side code — it identifies
   the project, it does not grant privileged access. Access control must be
   enforced server-side with Row Level Security (RLS) policies on your
   tables, not by hiding this key.
   ========================================================================== */

const SUPABASE_URL = "https://naattursexlswaggslzm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VHPRyEhb_64lUT4EX-R3og_QKEp0-hh";

if (!window.supabase) {
  throw new Error("Supabase client library failed to load. Check your network/CDN access.");
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Keeps the session in localStorage so a reopened tab/browser is still
    // signed in, and silently refreshes the access token before it expires.
    persistSession: true,
    autoRefreshToken: true,
    // No OAuth/magic-link redirect flow is used in this app, so there is no
    // auth payload to read out of the URL on load.
    detectSessionInUrl: false,
  },
});

/* ==========================================================================
   PUBLIC API — everything app.js needs, nothing it shouldn't touch directly.
   ========================================================================== */

const Auth = {
  /**
   * Attempts an email/password sign-in.
   * Resolves to { data, error } — never throws for expected auth failures
   * (bad credentials, unconfirmed email, etc.), only for network-level
   * failures the caller should also handle defensively.
   */
  signIn(email, password) {
    return supabaseClient.auth.signInWithPassword({ email, password });
  },

  /** Ends the current session (locally and on Supabase). */
  signOut() {
    return supabaseClient.auth.signOut();
  },

  /**
   * Subscribes to every auth transition: initial session on load, sign-in,
   * sign-out, and token refresh. This is the single source of truth the
   * app uses to decide whether to show the login screen or the app shell —
   * there is no separate one-off "check if logged in" call, so there is no
   * race between that check and this listener.
   *
   * `callback` receives (event, session).
   * Returns the underlying subscription so it can be torn down if needed.
   */
  onAuthStateChange(callback) {
    const { data } = supabaseClient.auth.onAuthStateChange(callback);
    return data.subscription;
  },

  /**
   * Gives service/helper modules (e.g. profileService.js) access to the
   * same Supabase client used for auth, so there is exactly one client
   * instance in the app and one place its credentials are configured.
   * Not intended to be called from app.js/UI code directly — all table
   * access should go through a service module.
   */
  getClient() {
    return supabaseClient;
  },
};

window.Auth = Auth;
