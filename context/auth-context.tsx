import { AsyncStorage } from '@/lib/storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface User {
  username: string;
  email: string;
}

interface StoredUser {
  username: string;
  email: string;
  password: string;
}

interface AuthContextType {
  isSignedIn: boolean;
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  signOut: () => void;
  checkAccountExists: (username: string) => Promise<boolean>;
  checkEmailExists: (email: string) => Promise<boolean>;
  getTotalUsers: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (userJson) {
        const currentUser = JSON.parse(userJson);
        setUser(currentUser);
        setIsSignedIn(true);
      }
    } catch (e) {
      console.error('Failed to restore token', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = useCallback(async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) {
      throw new Error('Invalid credentials');
    }

    try {
      // Get all registered users
      const usersJson = await AsyncStorage.getItem('registeredUsers');
      const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];

      // Find user with matching credentials
      const foundUser = users.find(
        (u) => u.username === username && u.password === password
      );

      if (!foundUser) {
        throw new Error('Invalid username or password');
      }

      const loggedInUser: User = {
        username: foundUser.username,
        email: foundUser.email,
      };

      setIsSignedIn(true);
      setUser(loggedInUser);

      // Save current user to storage
      await AsyncStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    } catch (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(
    async (username: string, email: string, password: string, confirmPassword: string) => {
      // Validation
      if (!username.trim() || !email.trim() || !password.trim()) {
        throw new Error('Please fill all fields');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      try {
        // Get existing users
        const usersJson = await AsyncStorage.getItem('registeredUsers');
        const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];

        // Check if user already exists
        if (users.some((u) => u.username === username)) {
          throw new Error('Username already exists');
        }

        if (users.some((u) => u.email === email)) {
          throw new Error('Email already registered');
        }

        // Add new user
        const newUser: StoredUser = { username, email, password };
        users.push(newUser);

        // Save to storage
        await AsyncStorage.setItem('registeredUsers', JSON.stringify(users));
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('currentUser');
      setIsSignedIn(false);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  const checkAccountExists = useCallback(async (username: string) => {
    try {
      const usersJson = await AsyncStorage.getItem('registeredUsers');
      const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
      return users.some((u) => u.username === username);
    } catch (error) {
      console.error('Error checking account:', error);
      return false;
    }
  }, []);

  const checkEmailExists = useCallback(async (email: string) => {
    try {
      const usersJson = await AsyncStorage.getItem('registeredUsers');
      const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
      return users.some((u) => u.email === email);
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }, []);

  const getTotalUsers = useCallback(async () => {
    try {
      const usersJson = await AsyncStorage.getItem('registeredUsers');
      const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
      return users.length;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        isSignedIn, 
        user, 
        isLoading, 
        signIn, 
        signUp, 
        signOut,
        checkAccountExists,
        checkEmailExists,
        getTotalUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
