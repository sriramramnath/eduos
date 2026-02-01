"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import * as React from "react";
import { api } from "../convex/_generated/api";
import { ClassDashboard } from "./components/ClassDashboard";
import { Onboarding } from "./components/Onboarding";

export default function App() {
  const user = useQuery(api.myFunctions.getCurrentUser);
  const identity = useQuery(api.myFunctions.getAuthenticatedUser);
  
  console.log("App rendering, user:", user, "identity:", identity);
  console.log("User role:", user?.role);
  console.log("User profile picture:", user?.profilePicture);
  
  if (user === undefined || identity === undefined) {
    return <div>Loading...</div>;
  }
  
  // Not authenticated at all
  if (!identity) {
    return <Registration />;
  }
  
  // Authenticated but no user record - create one
  if (!user) {
    return <AutoRegister identity={identity} />;
  }
  
  // User exists but no role - show onboarding
  if (!user.role) {
    return <RoleOnboarding user={user} />;
  }
  
  return <Dashboard user={user} />;
}

function RoleOnboarding({ user }: { user: any }) {
  const updateUserRole = useMutation(api.myFunctions.updateUserRole);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleRoleSelection = async () => {
    try {
      setIsUpdating(true);
      await updateUserRole({ role });
    } catch (error) {
      console.error("Role update failed:", error);
      setIsUpdating(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "3rem", 
        borderRadius: "12px", 
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        maxWidth: "28rem",
        width: "100%",
        margin: "1rem"
      }}>
        <h1 style={{ 
          fontSize: "1.875rem", 
          fontWeight: "bold", 
          marginBottom: "0.5rem",
          color: "#111827",
          textAlign: "center"
        }}>
          Welcome to EduOS
        </h1>
        <p style={{ 
          color: "#6b7280", 
          marginBottom: "2rem",
          textAlign: "center"
        }}>
          Hi {user.name}! Please select your role to get started.
        </p>
        
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "1rem" }}>
            I am a...
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              cursor: "pointer",
              padding: "1rem",
              border: role === "student" ? "2px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: role === "student" ? "#eff6ff" : "white"
            }}>
              <input
                type="radio"
                value="student"
                checked={role === "student"}
                onChange={(e) => setRole(e.target.value as "student")}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: "500", color: "#111827" }}>Student</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Join classes and access assignments</div>
              </div>
            </label>
            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              cursor: "pointer",
              padding: "1rem",
              border: role === "teacher" ? "2px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: role === "teacher" ? "#eff6ff" : "white"
            }}>
              <input
                type="radio"
                value="teacher"
                checked={role === "teacher"}
                onChange={(e) => setRole(e.target.value as "teacher")}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: "500", color: "#111827" }}>Teacher</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Create and manage classes</div>
              </div>
            </label>
          </div>
        </div>
        
        <button
          onClick={handleRoleSelection}
          disabled={isUpdating}
          style={{ 
            width: "100%", 
            backgroundColor: isUpdating ? "#9ca3af" : "#2563eb", 
            color: "white", 
            padding: "0.75rem 1.5rem", 
            borderRadius: "8px", 
            border: "none", 
            cursor: isUpdating ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "500"
          }}
        >
          {isUpdating ? "Setting up..." : "Continue"}
        </button>
      </div>
    </main>
  );
}

function AutoRegister({ identity }: { identity: any }) {
  const registerUser = useMutation(api.myFunctions.autoRegisterUser);
  
  React.useEffect(() => {
    registerUser({ name: identity.name || "User" });
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#f8fafc", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <div>Setting up your account...</div>
    </div>
  );
}

function UserRegistration({ identity }: { identity: any }) {
  const registerUser = useMutation(api.myFunctions.registerUser);
  const [name, setName] = useState(identity.name || "");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [isRegistering, setIsRegistering] = useState(false);
  
  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      await registerUser({ name, role });
    } catch (error) {
      console.error("Registration failed:", error);
      setIsRegistering(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "3rem", 
        borderRadius: "12px", 
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        maxWidth: "28rem",
        width: "100%",
        margin: "1rem"
      }}>
        <h1 style={{ 
          fontSize: "1.875rem", 
          fontWeight: "bold", 
          marginBottom: "0.5rem",
          color: "#111827",
          textAlign: "center"
        }}>
          Complete Your Registration
        </h1>
        <p style={{ 
          color: "#6b7280", 
          marginBottom: "2rem",
          textAlign: "center"
        }}>
          Welcome {identity.name}! Tell us a bit about yourself.
        </p>
        
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "0.75rem", 
              border: "1px solid #d1d5db", 
              borderRadius: "6px",
              fontSize: "1rem"
            }}
            placeholder="Enter your full name"
          />
        </div>
        
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
            I am a...
          </label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                value="student"
                checked={role === "student"}
                onChange={(e) => setRole(e.target.value as "student")}
              />
              Student
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                value="teacher"
                checked={role === "teacher"}
                onChange={(e) => setRole(e.target.value as "teacher")}
              />
              Teacher
            </label>
          </div>
        </div>
        
        <button
          onClick={handleRegister}
          disabled={!name.trim() || isRegistering}
          style={{ 
            width: "100%", 
            backgroundColor: (!name.trim() || isRegistering) ? "#9ca3af" : "#2563eb", 
            color: "white", 
            padding: "0.75rem 1.5rem", 
            borderRadius: "8px", 
            border: "none", 
            cursor: (!name.trim() || isRegistering) ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "500"
          }}
        >
          {isRegistering ? "Registering..." : "Complete Registration"}
        </button>
      </div>
    </main>
  );
}

function Registration() {
  const { signIn } = useAuthActions();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn("google");
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsSigningIn(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "3rem", 
        borderRadius: "12px", 
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        maxWidth: "24rem",
        width: "100%",
        margin: "1rem"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ 
            fontSize: "2.25rem", 
            fontWeight: "bold", 
            marginBottom: "0.5rem",
            color: "#111827"
          }}>
            EduOS
          </h1>
          <p style={{ 
            color: "#6b7280", 
            fontSize: "1rem",
            lineHeight: "1.5"
          }}>
            File-native education platform
          </p>
        </div>
        
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          style={{ 
            width: "100%", 
            backgroundColor: isSigningIn ? "#9ca3af" : "#2563eb", 
            color: "white", 
            padding: "0.75rem 1.5rem", 
            borderRadius: "8px", 
            border: "none", 
            cursor: isSigningIn ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
        >
          {isSigningIn ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </main>
  );
}

function Dashboard({ user }: { user: any }) {
  const { signOut } = useAuthActions();
  const classes = useQuery(api.myFunctions.getMyClasses) || [];
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <Onboarding 
        user={user} 
        onComplete={() => setShowOnboarding(false)} 
      />
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
        <header style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "3rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div>
            <h1 style={{ 
              fontSize: "2.25rem", 
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "0.25rem"
            }}>
              EduOS
            </h1>
            <p style={{ 
              color: "#6b7280", 
              fontSize: "1rem"
            }}>
              {user.role === "teacher" ? "Manage your classes and assignments" : "Access your classes and assignments"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img 
              src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=40&background=2563eb&color=ffffff&bold=true`}
              alt={user.name}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid #e5e7eb"
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ 
                fontSize: "0.875rem", 
                color: "#111827",
                fontWeight: "600"
              }}>
                {user.name}
              </span>
              <span style={{ 
                padding: "0.25rem 0.5rem", 
                backgroundColor: user.role === "teacher" ? "#fef3c7" : "#eff6ff", 
                color: user.role === "teacher" ? "#92400e" : "#1d4ed8", 
                borderRadius: "4px", 
                fontSize: "0.75rem",
                textTransform: "capitalize",
                fontWeight: "500",
                border: `1px solid ${user.role === "teacher" ? "#fde68a" : "#dbeafe"}`
              }}>
                {user.role}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              style={{ 
                fontSize: "0.875rem", 
                color: "#6b7280", 
                background: "none", 
                border: "none", 
                cursor: "pointer",
                padding: "0.5rem",
                borderRadius: "4px",
                fontWeight: "500"
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <ClassDashboard user={user} classes={classes} />
      </div>
    </main>
  );
}
