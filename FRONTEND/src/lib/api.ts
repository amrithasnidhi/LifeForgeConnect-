/**
 * src/lib/api.ts
 * ──────────────────────────────────────────────────────────────────
 * Single API client for the LifeForge Connect frontend.
 * Place this file at:  FRONTEND/src/lib/api.ts
 *
 * Add to your FRONTEND/.env:
 *   VITE_API_URL=http://localhost:8000
 *
 * Usage in any component / page:
 *   import { api } from "@/lib/api"
 *   const donors = await api.blood.getDonors({ blood_group: "O-" })
 * ──────────────────────────────────────────────────────────────────
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function req<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>
): Promise<T> {
    const url = new URL(BASE + path);

    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };

    // Attach JWT token if stored (set after login)
    const token = localStorage.getItem("lf_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "API request failed");
    }

    return res.json() as Promise<T>;
}

const get = <T>(path: string, params?: Record<string, any>) => req<T>("GET", path, undefined, params);
const post = <T>(path: string, body?: unknown) => req<T>("POST", path, body);


// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlatformStats {
    matches_today: number;
    lives_impacted: number;
    active_donors_online: number;
    hospitals_connected: number;
}

export interface BloodDonor {
    id: string; name: string; city: string; group: string;
    trust: number; trust_score: number; is_verified: boolean;
    available: boolean; eligible_to_donate: boolean;
    last_donated: string; distance_km: number | null; distance: string;
}

export interface BloodRequest {
    id: string; hospital: string; group: string; units: number;
    urgency: string; timeLeft: string; city: string; posted: string;
}

export interface BloodShortage {
    blood_group: string; requests: number; donors_available: number;
    deficit: number; severity: string;
}

export interface ThalPatient {
    id: string; name: string; age: number | null; group: string;
    hospital: string; freq: string; nextDate: string;
    donor: string; countdown: string; days_until: number | null; is_urgent: boolean;
}

export interface CalendarDay {
    day: string; date: string; has: boolean;
    label: string | null; patients: string[];
}

export interface PlateletRequest {
    id: string; patient: string; cancer: string; group: string;
    units: number; expiry: string; urgency: string;
    hospital: string; hospital_city: string;
    days_left: number; hours_left: number; is_critical: boolean;
}

export interface PlateletDonor {
    id: string; name: string; group: string; compat: number; trust: number;
    lastApheresis: string; nextAvail: string; city: string;
}

export interface MarrowMatch {
    id: string; donor_id: string; matchPct: number; confidence: string;
    hlaA: string; hlaB: string; location: string;
    age: number | null; donated: number; status: string;
}

export interface OrganViability {
    name: string; emoji: string; window: string;
    viabilityHrs: number; color: string;
}

export interface OrganRecipient {
    id: string; name: string; organ: string; blood: string;
    urgency: number; hospital: string; hospital_city: string;
    wait: string; distance_km: number | null; rank: number;
}

export interface MilkDonor {
    id: string; donor_id: string; name: string; babyAge: string;
    qty: string; area: string; verified: boolean; impact: string;
}

export interface MilkBankRow {
    id: string; from: string; pasteurized: string;
    expiry: string; qty: string; status: string;
}

export interface MilkShortageAlert {
    id: string; hospital: string; city: string;
    infant_name: string | null; quantity_needed: string; message: string;
}

export interface DonorDashboard {
    profile: {
        id: string; name: string; initial: string; blood_group: string;
        city: string; is_verified: boolean; donor_types: string[];
        trust_stars: number; is_available: boolean;
    };
    stats: {
        total_donations: number; lives_impacted: number;
        trust_score: number; next_eligible: string;
    };
    urgent_requests: Array<{
        type: string; module: string; group: string; hospital: string;
        distance: string; urgency: string; time: string;
    }>;
    donation_history: Array<{
        date: string; type: string; hospital: string; status: string; impact: string;
    }>;
}

export interface AdminDashboard {
    stats: {
        pending_verifications: number; flagged_accounts: number;
        total_users: number; todays_matches: number;
    };
    verification_queue: {
        donors: Array<{ id: string; name: string; type: string; city: string; docs: string; time: string }>;
        hospitals: Array<{ id: string; name: string; type: string; city: string; docs: string; time: string }>;
    };
    flagged_accounts: Array<{ id: string; name: string; city: string; trust_score: number }>;
}


// ── API surface ───────────────────────────────────────────────────────────────

export const api = {

    // ── Platform ────────────────────────────────────────────────────────────────

    stats: () =>
        get<PlatformStats>("/stats"),


    // ── Auth ────────────────────────────────────────────────────────────────────

    auth: {
        /** Register.tsx DonorRegister step-3 submit */
        registerDonor: (body: {
            first_name: string; last_name: string; mobile: string;
            aadhaar?: string; dob?: string; gender?: string;
            city: string; pincode?: string; blood_group: string;
            donor_types: string[]; email: string; password: string;
            lat?: number; lng?: number;
        }) => post("/auth/register/donor", body),

        /** Register.tsx HospitalRegister submit */
        registerHospital: (body: {
            name: string; reg_number: string; license?: string;
            address: string; city: string; contact_person: string;
            contact_mobile: string; contact_email: string; password: string;
        }) => post("/auth/register/hospital", body),

        /** Login.tsx Sign In button */
        login: async (email: string, password: string, role = "donor") => {
            const data = await post<{ access_token: string; user_id: string; role: string; redirect: string }>(
                "/auth/login", { email, password, role }
            );
            localStorage.setItem("lf_token", data.access_token);
            localStorage.setItem("lf_user_id", data.user_id);
            localStorage.setItem("lf_role", data.role);
            return data;
        },

        logout: () => {
            localStorage.removeItem("lf_token");
            localStorage.removeItem("lf_user_id");
            localStorage.removeItem("lf_role");
        },

        /** Login.tsx / Register.tsx 'Get OTP' button */
        sendOtp: (mobile: string) => post("/auth/otp/send", { mobile }),
        verifyOtp: (mobile: string, otp: string) => post("/auth/otp/verify", { mobile, otp }),
    },


    // ── BloodBridge ─────────────────────────────────────────────────────────────

    blood: {
        /** BloodBridge donor cards grid */
        getDonors: (params?: { blood_group?: string; city?: string; lat?: number; lng?: number; limit?: number }) =>
            get<BloodDonor[]>("/blood/donors", params),

        /** BloodBridge "Live Urgent Requests" list */
        getOpenRequests: () =>
            get<BloodRequest[]>("/blood/requests/open"),

        /** BloodBridge "Post Request" button (hospital) */
        postRequest: (body: { hospital_id: string; blood_group: string; units: number; urgency: string; lat?: number; lng?: number }) =>
            post("/blood/requests", body),

        /** Shortage prediction widget */
        getShortage: () =>
            get<BloodShortage[]>("/blood/shortage"),
    },


    // ── ThalCare ────────────────────────────────────────────────────────────────

    thal: {
        /** ThalCare "Active Patients" list */
        getPatients: (hospitalId?: string) =>
            get<ThalPatient[]>("/thal/patients", hospitalId ? { hospital_id: hospitalId } : undefined),

        /** ThalCare 7-day calendar widget */
        getCalendar: (daysAhead = 7) =>
            get<CalendarDay[]>("/thal/calendar", { days_ahead: daysAhead }),

        /** ThalCare "Register Patient" button */
        registerPatient: (body: { name: string; blood_group: string; hospital_id: string; transfusion_frequency_days?: number; last_transfusion_date?: string }) =>
            post("/thal/patients", body),

        /** After transfusion is completed */
        markDone: (patientId: string, transfusionDate: string) =>
            post("/thal/transfusion-done", { patient_id: patientId, transfusion_date: transfusionDate }),
    },


    // ── PlateletAlert ───────────────────────────────────────────────────────────

    platelet: {
        /** PlateletAlert requests list + viability clocks */
        getOpenRequests: () =>
            get<PlateletRequest[]>("/platelet/requests/open"),

        /** PlateletAlert compatible apheresis donor cards */
        getDonors: (params?: { blood_group?: string; city?: string }) =>
            get<PlateletDonor[]>("/platelet/donors", params),

        /** PlateletAlert "Add Patient" button */
        postRequest: (body: { patient_name: string; cancer_type?: string; blood_group?: string; units?: number; urgency?: string; hospital_id: string }) =>
            post("/platelet/requests", body),
    },


    // ── MarrowMatch ─────────────────────────────────────────────────────────────

    marrow: {
        /** MarrowMatch "Find Matches" button */
        findMatches: (patientHla: string[], patientId?: string, minMatchPercent = 30) =>
            post<{ patient_hla: string[]; total_found: number; matches: MarrowMatch[] }>(
                "/marrow/match", { patient_hla: patientHla, patient_id: patientId, min_match_percent: minMatchPercent }
            ),

        /** MarrowMatch "Register as Donor" button */
        registerHla: (donorId: string, hlaType: string[]) =>
            post("/marrow/register-hla", { donor_id: donorId, hla_type: hlaType }),

        getDonors: () => get("/marrow/donors"),
    },


    // ── LastGift (Organs) ────────────────────────────────────────────────────────

    organ: {
        /** LastGift viability cards grid */
        getViability: () =>
            get<OrganViability[]>("/organ/viability"),

        /** LastGift recipient ranking list */
        getRecipients: (params?: { organ_type?: string; blood_group?: string; donor_lat?: number; donor_lng?: number }) =>
            get<OrganRecipient[]>("/organ/recipients", params),

        /** LastGift "Get Digital Pledge Card" button */
        createPledge: (body: { donor_id: string; organs: string[]; family_consent: boolean }) =>
            post<{ pledge_id: string; pledge_id_short: string; organs_pledged: string[] }>("/organ/pledge", body),

        /** Hospital adds a recipient to the waiting list */
        postRequest: (body: { hospital_id: string; recipient_name: string; organ_needed: string; blood_group: string; urgency_score?: number }) =>
            post("/organ/requests", body),
    },


    // ── MilkBridge ──────────────────────────────────────────────────────────────

    milk: {
        /** MilkBridge active donor cards */
        getDonors: () =>
            get<MilkDonor[]>("/milk/donors"),

        /** MilkBridge Milk Bank table */
        getBank: () =>
            get<MilkBankRow[]>("/milk/bank"),

        /** MilkBridge shortage alert card */
        getShortageAlerts: () =>
            get<MilkShortageAlert[]>("/milk/shortage-alerts"),

        /** MilkBridge "Register as Donor" form */
        registerDonor: (body: { donor_id: string; baby_age_months: number; quantity_ml_per_day: number; pickup_location?: string }) =>
            post("/milk/register-donor", body),

        /** Hospital posts a shortage request */
        postRequest: (body: { hospital_id: string; infant_name?: string; daily_quantity_ml: number }) =>
            post("/milk/requests", body),
    },


    // ── Dashboard ───────────────────────────────────────────────────────────────

    dashboard: {
        /** DonorDashboard component */
        getDonor: (donorId: string) =>
            get<DonorDashboard>(`/dashboard/donor/${donorId}`),

        /** HospitalDashboard component */
        getHospital: (hospitalId: string) =>
            get(`/dashboard/hospital/${hospitalId}`),

        /** AdminDashboard component */
        getAdmin: () =>
            get<AdminDashboard>("/dashboard/admin"),

        /** Approve/reject from AdminDashboard verification queue */
        verify: (entityType: "donor" | "hospital", entityId: string, approved: boolean) =>
            post("/dashboard/admin/verify", { entity_type: entityType, entity_id: entityId, approved }),
    },

};

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Get logged-in user ID from localStorage */
export const getCurrentUserId = () => localStorage.getItem("lf_user_id") ?? "";
export const getCurrentRole = () => localStorage.getItem("lf_role") ?? "donor";
export const isLoggedIn = () => !!localStorage.getItem("lf_token");