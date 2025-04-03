import React, { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // For backward compatibility
  githubTokenIsSet: boolean;
  setGitHubTokenIsSet: (value: boolean) => void;
}

interface AuthContextProps extends React.PropsWithChildren {
  initialGithubTokenIsSet?: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children, initialGithubTokenIsSet }: AuthContextProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // For backward compatibility
  const [githubTokenIsSet, setGitHubTokenIsSet] = React.useState(
    !!initialGithubTokenIsSet,
  );

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      setGitHubTokenIsSet(true); // For backward compatibility
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }
      
      const data = await response.json();
      
      // Store authentication data
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);
      setGitHubTokenIsSet(true); // For backward compatibility
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Signup failed");
      }
      
      const data = await response.json();
      
      // Store authentication data
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);
      setGitHubTokenIsSet(true); // For backward compatibility
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call the signout endpoint
      if (token) {
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      // Clear local storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      
      // Reset state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setGitHubTokenIsSet(false); // For backward compatibility
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = React.useMemo(
    () => ({
      isAuthenticated,
      user,
      token,
      login,
      signup,
      logout,
      
      // For backward compatibility
      githubTokenIsSet,
      setGitHubTokenIsSet,
    }),
    [isAuthenticated, user, token, githubTokenIsSet],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
