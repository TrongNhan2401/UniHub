"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { signinApi, signupApi, verifyOtpApi } from "../apis/authApi";
import { getUserProfileApi } from "../apis/userApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    /* ===========================
       INITIAL AUTH CHECK
       =========================== */
    useEffect(() => {
        const bootstrapAuth = async () => {
            const savedToken = localStorage.getItem("token");

            if (!savedToken) {
                setLoading(false);
                return;
            }

            setToken(savedToken);

            try {
                // If your API client needs the token in headers, ensure it's set here
                // or handled in the interceptor.
                const profile = await getUserProfileApi();
                setUser(profile);
            } catch (err) {
                console.error("Auth bootstrap failed:", err);
                logout();
            } finally {
                setLoading(false);
            }
        };

        bootstrapAuth();
    }, []);


    /* ===========================
       LOGIN
       =========================== */
    const signin = async (email, password) => {
        setLoading(true);
        try {
            const response = await signinApi(email, password);
            if (response.requiresTwoFactor) {
                return { success: true, requiresTwoFactor: true };
            }

            const jwt = typeof response === 'string' ? response : response.token || response.accessToken;

            if (!jwt || typeof jwt !== "string") {
                throw new Error("Invalid token received from server");
            }

            localStorage.setItem("token", jwt);
            setToken(jwt);

            const profile = await getUserProfileApi();
            setUser(profile);

            return { success: true, requiresTwoFactor: false };

        } catch (err) {
            console.error("Login logic failed:", err);
            const errorMessage = err.response?.data?.Detail || err.message || "Login failed";
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /* ===========================
       VERIFY OTP
       =========================== */
    const verifyOtp = async (email, otp) => {
        setLoading(true);
        try {
            const response = await verifyOtpApi(email, otp);
            const jwt = typeof response === 'string' ? response : response.token || response.accessToken;

            if (!jwt || typeof jwt !== "string") {
                throw new Error("Invalid token received from server");
            }

            localStorage.setItem("token", jwt);
            setToken(jwt);

            const profile = await getUserProfileApi();
            setUser(profile);

            return { success: true };
        } catch (err) {
            console.error("OTP verification failed:", err);
            const errorMessage = err.response?.data?.Detail || err.message || "Xác thực OTP thất bại";
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    /* ===========================
       REGISTER
       =========================== */
    const signup = async (payload) => {
        setLoading(true);
        try {
            const response = await signupApi(payload);
            const jwt = typeof response === 'string' ? response : response.token || response.accessToken;

            if (!jwt || typeof jwt !== "string") {
                throw new Error("Registration succeeded but token was not received.");
            }

            localStorage.setItem("token", jwt);
            setToken(jwt);

            const profile = await getUserProfileApi();
            setUser(profile);

            return { success: true };
        } catch (err) {
            console.error("Signup logic failed:", err);
            const errorMessage = err.response?.data?.Detail || err.message || "Registration failed";
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };


    /* ===========================
       LOGOUT
       =========================== */
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
    };



    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                signin,
                verifyOtp,
                signup,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

/* ===========================
   CUSTOM HOOK
   =========================== */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
