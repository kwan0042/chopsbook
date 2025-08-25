// src/lib/auth-context.js
"use client";

import React, { useState, useEffect, createContext, useRef } from "react";
import {
  initializeFirebaseApp,
  getFirebaseDb,
  getFirebaseAuth,
  getFirebaseAnalytics,
} from "./firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithCustomToken,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Modal from "../components/Modal";

const projectAppId =
  typeof __app_id !== "undefined" ? __app_id : "default-app-id";

const localFirebaseConfig = {
  apiKey: "AIzaSyBtXmTdeY4bTn558wLhZ-9GkVejWxe_3lk",
  authDomain: "chopsbook.firebaseapp.com",
  projectId: "chopsbook",
  storageBucket: "chopsbook.firebasestorage.app",
  messagingSenderId: "357146304445",
  appId: "1:357146304445:web:b97659b3ad6e276e62fcd4",
  measurementId: "G-H4M0D99T60",
};

const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [modalMessage, setModalMessage] = useState("");

  const appInstanceRef = useRef(null);
  const dbInstanceRef = useRef(null);
  const authInstanceRef = useRef(null);
  const analyticsInstanceRef = useRef(null);

  useEffect(() => {
    const currentFirebaseConfig =
      typeof __firebase_config !== "undefined"
        ? JSON.parse(__firebase_config)
        : localFirebaseConfig;

    try {
      appInstanceRef.current = initializeFirebaseApp(currentFirebaseConfig);
      dbInstanceRef.current = getFirebaseDb(appInstanceRef.current);
      authInstanceRef.current = getFirebaseAuth(appInstanceRef.current);
      analyticsInstanceRef.current = getFirebaseAnalytics(
        appInstanceRef.current
      );

      if (authInstanceRef.current) {
        const unsubscribe = onAuthStateChanged(
          authInstanceRef.current,
          async (user) => {
            let userWithRole = null;
            if (user) {
              try {
                // 顯式創建用戶根文檔
                const userRootDocRef = doc(
                  dbInstanceRef.current,
                  `artifacts/${projectAppId}/users/${user.uid}`
                );
                const userRootDocSnap = await getDoc(userRootDocRef);

                if (!userRootDocSnap.exists()) {
                  await setDoc(
                    userRootDocRef,
                    { uid: user.uid, lastLogin: new Date().toISOString() },
                    { merge: true }
                  );
                }

                const userProfileDocRef = doc(
                  dbInstanceRef.current,
                  `artifacts/${projectAppId}/users/${user.uid}/profile`,
                  "main"
                );

                const userProfileDocSnap = await getDoc(userProfileDocRef);

                if (userProfileDocSnap.exists()) {
                  const userData = userProfileDocSnap.data();
                  if (userData.isAdmin === undefined) {
                    userData.isAdmin = user.email === "kwan6d16@gmail.com";
                    await setDoc(
                      userProfileDocRef,
                      { ...userData },
                      { merge: true }
                    );
                  }
                  userWithRole = { ...user, ...userData };
                } else {
                  const newUserProfile = {
                    email: user.email,
                    createdAt: new Date().toISOString(),
                    isAdmin: user.email === "kwan6d16@gmail.com",
                  };
                  await setDoc(userProfileDocRef, newUserProfile);
                  userWithRole = { ...user, ...newUserProfile };
                }
              } catch (dbError) {
                setModalMessage(`用戶資料處理失敗: ${dbError.message}`);
                userWithRole = user;
              }
            } else {
              if (initialAuthToken) {
                try {
                  await signInWithCustomToken(
                    authInstanceRef.current,
                    initialAuthToken
                  );
                } catch (tokenError) {
                  setModalMessage(`自動認證失敗: ${tokenError.message}`);
                }
              }
              userWithRole = null;
            }
            setCurrentUser(userWithRole);
            setLoadingUser(false);
          }
        );

        return () => unsubscribe();
      } else {
        setModalMessage("Firebase 認證服務初始化失敗");
        setLoadingUser(false);
      }
    } catch (error) {
      setModalMessage(`Firebase 初始化失敗: ${error.message}`);
      setLoadingUser(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }
      await signInWithEmailAndPassword(
        authInstanceRef.current,
        email,
        password
      );
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }
      await createUserWithEmailAndPassword(
        authInstanceRef.current,
        email,
        password
      );
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (!authInstanceRef.current) {
        throw new Error("Firebase 認證服務未初始化");
      }
      await signOut(authInstanceRef.current);
      setModalMessage("登出成功！");
    } catch (error) {
      const errorMessage = error.message || "登出失敗，請稍後再試";
      setModalMessage(`登出失敗: ${errorMessage}`);
    }
  };

  const updateUserAdminStatus = async (userId, isAdmin) => {
    try {
      if (!dbInstanceRef.current) {
        throw new Error("Firebase 資料庫服務未初始化");
      }

      const userProfileDocRef = doc(
        dbInstanceRef.current,
        `artifacts/${projectAppId}/users/${userId}/profile`,
        "main"
      );

      await setDoc(userProfileDocRef, { isAdmin }, { merge: true });

      if (currentUser && currentUser.uid === userId) {
        const userDocSnap = await getDoc(userProfileDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({ ...currentUser, ...userData });
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  const closeModal = () => {
    setModalMessage("");
  };

  const currentIsAdmin = currentUser && currentUser.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loadingUser,
        db: dbInstanceRef.current,
        auth: authInstanceRef.current,
        analytics: analyticsInstanceRef.current,
        appId: projectAppId,
        setModalMessage,
        login,
        signup,
        logout,
        isAdmin: currentIsAdmin,
        updateUserAdminStatus,
      }}
    >
      {children}
      {modalMessage && (
        <Modal
          message={modalMessage}
          onClose={closeModal}
          isOpen={!!modalMessage}
        />
      )}
    </AuthContext.Provider>
  );
};
