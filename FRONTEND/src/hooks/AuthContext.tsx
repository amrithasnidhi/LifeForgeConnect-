import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "donor" | "hospital" | "admin" | null;
export type OrgType = "hospital" | "bloodbank" | "orphanage" | "ngo" | null;

export interface UserProfile {
    name?: string;
    city?: string;
    blood_group?: string;
    trust_score?: number;
    is_verified?: boolean;
    donor_types?: string[];
}

interface AuthContextType {
    role: UserRole;
    orgType: OrgType;
    userName: string;
    profile: UserProfile | null;
    login: (role: UserRole, userName: string, orgType?: OrgType, profile?: UserProfile) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    role: null,
    orgType: null,
    userName: "",
    profile: null,
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>(() => {
        const saved = localStorage.getItem("lfc_role");
        return (saved as UserRole) || null;
    });
    const [orgType, setOrgType] = useState<OrgType>(() => {
        const saved = localStorage.getItem("lfc_orgType");
        return (saved as OrgType) || null;
    });
    const [userName, setUserName] = useState(() => {
        return localStorage.getItem("lfc_userName") || "";
    });
    const [profile, setProfile] = useState<UserProfile | null>(() => {
        const saved = localStorage.getItem("lfc_profile");
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (role) {
            localStorage.setItem("lfc_role", role);
        } else {
            localStorage.removeItem("lfc_role");
        }
    }, [role]);

    useEffect(() => {
        if (orgType) {
            localStorage.setItem("lfc_orgType", orgType);
        } else {
            localStorage.removeItem("lfc_orgType");
        }
    }, [orgType]);

    useEffect(() => {
        if (userName) {
            localStorage.setItem("lfc_userName", userName);
        } else {
            localStorage.removeItem("lfc_userName");
        }
    }, [userName]);

    useEffect(() => {
        if (profile) {
            localStorage.setItem("lfc_profile", JSON.stringify(profile));
        } else {
            localStorage.removeItem("lfc_profile");
        }
    }, [profile]);

    const login = (newRole: UserRole, name: string, newOrgType?: OrgType, newProfile?: UserProfile) => {
        setRole(newRole);
        setUserName(name);
        setOrgType(newOrgType || null);
        setProfile(newProfile || null);
    };

    const logout = () => {
        setRole(null);
        setUserName("");
        setOrgType(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ role, orgType, userName, profile, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
