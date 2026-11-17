import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";
const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { ok, data } = await api.get("/api/auth/me");
        if (ok) {
          setUser(data.user);
          setToken(data.token);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        setToken(null);
      }

      setLoading(false);
      setInitialCheckDone(true);
    };

    checkAuth();
  }, []);

  const register = async (username, email, password) => {
    try {
      const { ok, data } = await api.post("/api/auth/register", {
        username,
        email,
        password,
      });

      if (ok) {
        const session = await api.get("/api/auth/me");
        setUser(data.user);
        setToken(session.ok ? session.data.token : null);
        return { success: true };
      } else {
        return {
          success: false,
          message: data?.message || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: "Network error" };
    }
  };

  const login = async (email, password) => {
    try {
      const { ok, data } = await api.post("/api/auth/login", {
        email,
        password,
      });

      if (ok) {
        const session = await api.get("/api/auth/me");
        setUser(data.user);
        setToken(session.ok ? session.data.token : null);
        return { success: true };
      } else {
        return {
          success: false,
          message: data?.message || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Network error" };
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {});
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initialCheckDone,
        register,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
