import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ClassDashboardProps {
  user: any;
  classes: any[];
}

export function ClassDashboard({ user, classes }: ClassDashboardProps) {
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  if (selectedClass) {
    return <ClassView classData={selectedClass} user={user} onBack={() => setSelectedClass(null)} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#111827", marginBottom: "0.25rem" }}>
            {user.role === "teacher" ? "My Classes" : "Joined Classes"}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {user.role === "teacher" ? "Create and manage your classes" : "Access your enrolled classes"}
          </p>
        </div>
        
        {user.role === "teacher" ? (
          <button
            onClick={() => setShowCreateClass(true)}
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            Create Class
          </button>
        ) : (
          <button
            onClick={() => setShowJoinClass(true)}
            style={{
              backgroundColor: "#059669",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            Join Class
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "3rem", 
          backgroundColor: "white", 
          borderRadius: "12px",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827", marginBottom: "0.5rem" }}>
            {user.role === "teacher" ? "No classes created yet" : "No classes joined yet"}
          </h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            {user.role === "teacher" 
              ? "Create your first class to start sharing assignments with students"
              : "Join a class using the class code provided by your teacher"
            }
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {classes.map((classData) => (
            <div
              key={classData._id}
              onClick={() => setSelectedClass(classData)}
              style={{
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.borderColor = "#2563eb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827", marginBottom: "0.5rem" }}>
                {classData.name}
              </h3>
              <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {classData.description || "No description"}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontFamily: "monospace"
                }}>
                  {classData.code}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Click to open
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateClass && <CreateClassModal onClose={() => setShowCreateClass(false)} />}
      {showJoinClass && <JoinClassModal onClose={() => setShowJoinClass(false)} />}
    </div>
  );
}

function CreateClassModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createClass = useMutation(api.myFunctions.createClass);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClass({ name, description });
      onClose();
    } catch (error) {
      console.error("Failed to create class:", error);
    }
  };

  return (
    <div style={{ position: "fixed", inset: "0", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: "50" }}>
      <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", maxWidth: "28rem", width: "100%", margin: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Create New Class</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Class Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
              placeholder="e.g., Mathematics Grade 10"
            />
          </div>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", minHeight: "80px" }}
              placeholder="Brief description of the class"
            />
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="submit"
              style={{ flex: "1", backgroundColor: "#2563eb", color: "white", padding: "0.75rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "500" }}
            >
              Create Class
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: "1", backgroundColor: "#f3f4f6", color: "#374151", padding: "0.75rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "500" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinClassModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const joinClass = useMutation(api.myFunctions.joinClass);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinClass({ code: code.toUpperCase() });
      onClose();
    } catch (error) {
      console.error("Failed to join class:", error);
      alert("Failed to join class. Please check the class code.");
    }
  };

  return (
    <div style={{ position: "fixed", inset: "0", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: "50" }}>
      <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", maxWidth: "24rem", width: "100%", margin: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Join Class</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Class Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontFamily: "monospace", textAlign: "center", fontSize: "1.125rem" }}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="submit"
              style={{ flex: "1", backgroundColor: "#059669", color: "white", padding: "0.75rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "500" }}
            >
              Join Class
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: "1", backgroundColor: "#f3f4f6", color: "#374151", padding: "0.75rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "500" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClassView({ classData, user, onBack }: { classData: any; user: any; onBack: () => void }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={onBack}
          style={{ backgroundColor: "#f3f4f6", color: "#374151", padding: "0.5rem", borderRadius: "6px", border: "none", cursor: "pointer" }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#111827" }}>{classData.name}</h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Class Code: {classData.code}</p>
        </div>
      </div>
      
      <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #e5e7eb", textAlign: "center" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>Class Content</h3>
        <p style={{ color: "#6b7280" }}>
          {user.role === "teacher" 
            ? "Upload assignments and materials for your students"
            : "View assignments and submit your work"
          }
        </p>
      </div>
    </div>
  );
}
