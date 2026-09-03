import { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [mfaTempData, setMfaTempData] = useState(null); // stores email and tempToken during MFA step

  // Load user profile on mount if token exists
  useEffect(() => {
    const bootstrapAuth = async () => {
      if (token) {
        try {
          const profile = await apiFetch('/auth/profile');
          setUser(profile);
          
          // Seed simulation defaults if not set
          if (!localStorage.getItem('sim_device_id')) {
            localStorage.setItem('sim_device_id', 'device-trusted-sai-win');
            localStorage.setItem('sim_device_name', 'Chrome 124 on Windows 11');
            localStorage.setItem('sim_ip', '192.168.1.10');
            localStorage.setItem('sim_country', 'India');
            localStorage.setItem('sim_city', 'Mumbai');
            localStorage.setItem('sim_mfa_verified', 'false');
          }
        } catch (error) {
          console.error('Failed to load profile on mount:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (data.mfaRequired) {
        // MFA challenge triggered
        setMfaTempData({
          email: data.email,
          maskedEmail: data.maskedEmail || data.email,
          tempToken: data.tempToken,
          hasTotp: !!data.hasTotp,
        });
        localStorage.setItem('token', data.tempToken); // temporarily store to authorize verify-mfa request
        setLoading(false);
        return { mfaRequired: true };
      }

      // Normal Login Success
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const verifyMfaCode = async (otpCode) => {
    setLoading(true);
    try {
      // Sends code. apiFetch injects the tempToken automatically since it's stored in localStorage
      const data = await apiFetch('/auth/verify-mfa', {
        method: 'POST',
        body: { token: otpCode },
      });

      // Login Completed
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('sim_mfa_verified', 'true'); // mark MFA as completed for the zero trust middleware
      setToken(data.token);
      setUser(data);
      setMfaTempData(null);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: userData,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setToken(data.token);
      setUser(data);
      setLoading(false);
      return { success: true, user: data };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resendMfaCode = async () => {
    if (!mfaTempData?.tempToken) {
      throw new Error('No active MFA session found. Please try logging in again.');
    }
    try {
      const data = await apiFetch('/auth/mfa/resend', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mfaTempData.tempToken}`,
        },
      });
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sim_mfa_verified');
    sessionStorage.removeItem('unlocked_resources');
    setUser(null);
    setToken(null);
    setMfaTempData(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiFetch('/auth/profile');
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Failed to refresh profile:', error.message);
    }
  };

  const value = {
    user,
    token,
    loading,
    mfaTempData,
    login,
    verifyMfaCode,
    resendMfaCode,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
