import React, { createContext, useContext, useState, useEffect } from 'react';
import { LoginRequest, RegisterRequest, TokenResponse, UserSession } from '../types/auth';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: UserSession | null;
  accessToken: string | null;
  activeCentreId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<TokenResponse>;
  register: (payload: RegisterRequest) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  setActiveCentreId: (centreId: string) => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeCentreId, setActiveCentreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('iys_access_token');
      const storedUser = localStorage.getItem('iys_user');
      const storedCentre = localStorage.getItem('iys_active_centre');

      if (storedToken && storedUser) {
        const parsedUser: UserSession = JSON.parse(storedUser);
        setAccessToken(storedToken);
        setUser(parsedUser);
        setActiveCentreId(storedCentre || parsedUser.centreId);
      }
    } catch (e) {
      console.error('Failed to restore auth state', e);
      localStorage.removeItem('iys_access_token');
      localStorage.removeItem('iys_refresh_token');
      localStorage.removeItem('iys_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthSuccess = (tokenData: TokenResponse) => {
    setAccessToken(tokenData.accessToken);
    localStorage.setItem('iys_access_token', tokenData.accessToken);

    if (tokenData.refreshToken) {
      localStorage.setItem('iys_refresh_token', tokenData.refreshToken);
    }

    const sessionUser: UserSession = {
      userId: tokenData.userId,
      email: tokenData.email,
      centreId: tokenData.centreId,
      roles: tokenData.roles || [],
    };

    setUser(sessionUser);
    setActiveCentreId(tokenData.centreId);
    localStorage.setItem('iys_user', JSON.stringify(sessionUser));
    if (tokenData.centreId) {
      localStorage.setItem('iys_active_centre', tokenData.centreId);
    }
  };

  const login = async (credentials: LoginRequest): Promise<TokenResponse> => {
    const res = await authApi.login(credentials);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Login failed');
    }
    handleAuthSuccess(res.data);
    return res.data;
  };

  const register = async (payload: RegisterRequest): Promise<TokenResponse> => {
    const res = await authApi.register(payload);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Registration failed');
    }
    handleAuthSuccess(res.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API error', e);
    } finally {
      localStorage.removeItem('iys_access_token');
      localStorage.removeItem('iys_refresh_token');
      localStorage.removeItem('iys_user');
      localStorage.removeItem('iys_active_centre');
      setUser(null);
      setAccessToken(null);
      setActiveCentreId(null);
    }
  };

  const handleSetActiveCentreId = (centreId: string) => {
    setActiveCentreId(centreId);
    localStorage.setItem('iys_active_centre', centreId);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.some((r) => user.roles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        activeCentreId,
        isAuthenticated: !!accessToken && !!user,
        isLoading,
        login,
        register,
        logout,
        setActiveCentreId: handleSetActiveCentreId,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
