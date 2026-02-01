interface OnboardingProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  onComplete: () => void;
}

export function Onboarding({ user, onComplete }: OnboardingProps) {
  const toPascalCase = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getProfilePicture = (email: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=128&background=2563eb&color=ffffff&bold=true`;
  };

  return (
    <div style={{ 
      position: "fixed", 
      inset: "0", 
      backgroundColor: "rgba(0, 0, 0, 0.5)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      zIndex: "50" 
    }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "3rem", 
        borderRadius: "12px", 
        maxWidth: "28rem", 
        width: "100%", 
        margin: "1rem", 
        textAlign: "center",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        <img
          src={getProfilePicture(user.email)}
          alt={user.name}
          style={{ 
            width: "6rem", 
            height: "6rem", 
            borderRadius: "50%", 
            margin: "0 auto 1.5rem auto",
            border: "4px solid #f3f4f6"
          }}
        />
        
        <h1 style={{ 
          fontSize: "1.875rem", 
          fontWeight: "bold", 
          marginBottom: "0.5rem",
          color: "#111827"
        }}>
          Welcome to EduOS, {toPascalCase(user.name)}!
        </h1>
        
        <p style={{ 
          color: "#6b7280", 
          marginBottom: "2rem",
          fontSize: "1rem",
          lineHeight: "1.5"
        }}>
          You're all set up as a <span style={{ fontWeight: "600", color: "#2563eb", textTransform: "capitalize" }}>{user.role}</span>. 
          Ready to upload anything and edit what makes sense?
        </p>
        
        <button
          onClick={onComplete}
          style={{ 
            width: "100%", 
            backgroundColor: "#2563eb", 
            color: "white", 
            padding: "0.75rem 1.5rem", 
            borderRadius: "8px", 
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "1rem",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#1d4ed8"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#2563eb"}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
