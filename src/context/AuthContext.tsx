import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db, logout, handleFirestoreError, OperationType } from '../lib/firebase';

interface ClientData {
  clientId: string;
  maxUsers: number;
  users: string[];
  ownerEmail: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authorized: boolean;
  clientData: ClientData | null;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authorized: false,
  clientData: null,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      
      if (firebaseUser?.email) {
        const email = firebaseUser.email.toLowerCase();
        setUser(firebaseUser);
        try {
          // Check if user is in any client's users list - Faster parallel checks
          const clientsRef = collection(db, 'clients');
          const [usersSnapshot, ownerSnapshot] = await Promise.all([
            getDocs(query(clientsRef, where('users', 'array-contains', email), limit(1))),
            getDocs(query(clientsRef, where('ownerEmail', '==', email), limit(1)))
          ]);

          if (!usersSnapshot.empty) {
            const doc = usersSnapshot.docs[0];
            setClientData(doc.data() as ClientData);
            setAuthorized(true);
          } else if (!ownerSnapshot.empty) {
            const doc = ownerSnapshot.docs[0];
            setClientData(doc.data() as ClientData);
            setAuthorized(true);
          } else {
            console.log("No client found for user in DB:", email);
            setAuthorized(false);
            setClientData(null);
          }
        } catch (err: any) {
          console.error("Auth check error:", err);
          setError(err.message || "Failed to verify access permissions.");
          setAuthorized(false);
        }
      } else {
        setUser(null);
        setAuthorized(false);
        setClientData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    authorized,
    clientData,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
