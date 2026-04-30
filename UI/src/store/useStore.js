import { create } from 'zustand';

// ─── UI Store ───────────────────────────────────────────────
// Sidebar toggle, active project, and small global UI state.
// These are low-frequency, cross-page values that don't belong
// in React Query (they're not server data).

export const useUIStore = create((set) => ({
    // Sidebar
    isSidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),

    // Active project context (used for cross-page navigation)
    activeProjectId: null,
    setActiveProjectId: (id) => set({ activeProjectId: id }),
}));

// ─── Auth Store ─────────────────────────────────────────────
// Holds the Firebase user object and derived auth state.
// Accessible from any page via `useAuthStore()`.
//
// Usage in Login/Signup:
//   const { setUser } = useAuthStore();
//   await signInWithEmailAndPassword(auth, email, password);
//   setUser(auth.currentUser);
//
// Usage anywhere:
//   const { user, isAuthenticated } = useAuthStore();

export const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,

    /**
     * Store the Firebase user object after successful login/signup.
     * Extracts commonly needed fields for convenience.
     */
    setUser: (firebaseUser) => {
        if (!firebaseUser) {
            set({ user: null, isAuthenticated: false });
            return;
        }
        set({
            user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
            },
            isAuthenticated: true,
        });
    },

    /** Get the current user (useful outside React components). */
    getUser: () => get().user,

    /** Clear session on logout. */
    logout: () => set({ user: null, isAuthenticated: false }),
}));
