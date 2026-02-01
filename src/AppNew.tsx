import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { FileGrid } from "./components/FileGrid";
import { UploadButton } from "./components/UploadButton";
import { TimerPanel } from "./components/TimerPanel";

function App() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </main>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">EduOS</h1>
        <button
          onClick={() => signIn("google")}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.functions.getCurrentUser);
  const files = useQuery(api.functions.getFiles);
  const timers = useQuery(api.functions.getActiveTimers);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">EduOS</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
            {user.role}
          </span>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Files</h2>
            {user.role !== "student" && <UploadButton />}
          </div>
          <FileGrid files={files || []} userRole={user.role} />
        </div>
        
        <div className="lg:col-span-1">
          <TimerPanel timers={timers || []} />
        </div>
      </div>
    </div>
  );
}

export default App;
