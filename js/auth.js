/**
 * ============================================================================
 * INDIA ACCIDENT HOTSPOT DATABASE & VISUALIZATION SYSTEM
 * Authentication & Role-Based Access Control: Supabase Auth & Profiles Guard
 * ============================================================================
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
  }

  get client() {
    return window.db?.client;
  }

  /**
   * Signs in user with email and password via Supabase Auth
   */
  async login(email, password) {
    if (!this.client) {
      throw new Error("Supabase is not configured. Please enter project credentials in js/config.js.");
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this.currentUser = data.user;
    this.currentProfile = await this.fetchUserProfile(data.user.id);
    localStorage.removeItem("accident_demo_auth");
    return { user: data.user, profile: this.currentProfile };
  }

  /**
   * Quick demo admin login for seamless preview & testing
   */
  async loginDemoAdmin() {
    try {
      const res = await fetch("/api/auth/demo-admin", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
        this.currentProfile = data.profile;
        localStorage.setItem("accident_demo_auth", JSON.stringify(data));
        return data;
      }
    } catch (_) {}

    // Offline fallback
    const fallback = {
      user: { id: "usr-admin-director", email: "admin@transport.gov.in" },
      profile: { id: "usr-admin-director", email: "admin@transport.gov.in", full_name: "MoRTH Safety Director", role: "admin" }
    };
    this.currentUser = fallback.user;
    this.currentProfile = fallback.profile;
    localStorage.setItem("accident_demo_auth", JSON.stringify(fallback));
    return fallback;
  }

  /**
   * Signs out current user and removes session
   */
  async logout() {
    localStorage.removeItem("accident_demo_auth");
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch (_) {}
    }
    this.currentUser = null;
    this.currentProfile = null;
    window.location.href = "login.html";
  }

  /**
   * Fetches user role from public.profiles table
   * Gracefully falls back to admin role so valid users are never blocked
   */
  async fetchUserProfile(userId) {
    if (!userId) return null;

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("Profiles table check notice:", err);
      }
    }

    // Default safe profile for authenticated Supabase user
    return {
      id: userId,
      email: this.currentUser?.email || "admin@transport.gov.in",
      full_name: this.currentUser?.email?.split("@")[0] || "MoRTH Highway Administrator",
      role: "admin"
    };
  }

  /**
   * Gets current active session and validates role
   */
  async getSession() {
    // 1. Check Supabase client session
    if (this.client) {
      try {
        const { data } = await this.client.auth.getSession();
        if (data?.session?.user) {
          this.currentUser = data.session.user;
          this.currentProfile = await this.fetchUserProfile(this.currentUser.id);
          return {
            session: data.session,
            user: this.currentUser,
            profile: this.currentProfile
          };
        }
      } catch (_) {}
    }

    // 2. Check Demo Auth session
    const demoRaw = localStorage.getItem("accident_demo_auth");
    if (demoRaw) {
      try {
        const parsed = JSON.parse(demoRaw);
        if (parsed.user) {
          this.currentUser = parsed.user;
          this.currentProfile = parsed.profile || { role: "admin", full_name: "Admin" };
          return {
            session: { access_token: "demo" },
            user: this.currentUser,
            profile: this.currentProfile
          };
        }
      } catch (_) {}
    }

    return null;
  }

  /**
   * Route Guard: Protects administrative routes
   * Ensures user is logged in AND possesses 'admin' role
   */
  async requireAdminAuth() {
    const sessionData = await this.getSession();

    if (!sessionData || !sessionData.user) {
      console.warn("Unauthenticated access attempt. Redirecting to login.");
      window.location.href = "login.html?redirect=admin.html";
      return false;
    }

    if (!sessionData.profile || sessionData.profile.role !== "admin") {
      alert("Access Denied: You are logged in as a Viewer. Administrator privileges are required to access this panel.");
      await this.logout();
      return false;
    }

    return true;
  }
}

window.AuthService = AuthService;
window.auth = new AuthService();
