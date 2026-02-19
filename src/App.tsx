import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ClassDashboard } from "./components/ClassDashboard";
import { SettingsPage } from "./components/SettingsPage";
import { GraduationCap, Presentation, Paperclip, Globe, UsersRound, TrendingUp, House, Settings, Info, LogIn, ArrowLeft } from "lucide-react";
import { BookMascot } from "./components/BookMascot";
import { ACCENT_COLOR_MAP, DEFAULT_ACCENT_COLOR, type AccentColorKey } from "./lib/accentColors";

type ThemePreference = "device" | "sun" | "moon";

const THEME_COOKIE_NAME = "eduos_theme";

const getThemeCookie = () => {
  const match = document.cookie.match(new RegExp(`(^| )${THEME_COOKIE_NAME}=([^;]+)`));
  const value = match ? decodeURIComponent(match[2]) : null;
  return value === "device" || value === "sun" || value === "moon" ? value : "device";
};

const setThemeCookie = (theme: ThemePreference, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; expires=${expires}; path=/; SameSite=Lax`;
};

export default function App() {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof document === "undefined") {
      return "device";
    }
    return getThemeCookie();
  });

  useEffect(() => {
    const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const applyTheme = () => {
      const prefersDark = media ? media.matches : false;
      const resolvedTheme = theme === "device" ? (prefersDark ? "moon" : "sun") : theme;
      document.documentElement.setAttribute("data-theme", resolvedTheme);
      document.documentElement.style.colorScheme = resolvedTheme === "moon" ? "dark" : "light";
    };

    applyTheme();
    setThemeCookie(theme);

    if (theme === "device" && media) {
      if ("addEventListener" in media) {
        media.addEventListener("change", applyTheme);
        return () => media.removeEventListener("change", applyTheme);
      }

      const legacyMedia = media as MediaQueryList & {
        addListener?: (listener: () => void) => void;
        removeListener?: (listener: () => void) => void;
      };

      if (typeof legacyMedia.addListener === "function") {
        legacyMedia.addListener(applyTheme);
        return () => legacyMedia.removeListener?.(applyTheme);
      }
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-white relative">
      <Authenticated>
        <DashboardContent theme={theme} onThemeChange={setTheme} />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </div>
  );
}


function DashboardContent({
  theme,
  onThemeChange,
}: {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}) {
  const { signOut } = useAuthActions();
  const user = useQuery(api.myFunctions.getCurrentUser);
  const classes = useQuery(api.myFunctions.getMyClasses) || [];
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [activePage, setActivePage] = useState<"dashboard" | "settings">("dashboard");

  useEffect(() => {
    if (!user) return;
    const userAccent = (user as any).accentColor as AccentColorKey | undefined;
    const selectedAccent = (userAccent || DEFAULT_ACCENT_COLOR) as AccentColorKey;
    const accent = ACCENT_COLOR_MAP[selectedAccent] || ACCENT_COLOR_MAP[DEFAULT_ACCENT_COLOR];
    document.documentElement.style.setProperty("--app-accent", accent.value);
    document.documentElement.style.setProperty("--app-accent-weak", accent.weak);
    document.documentElement.style.setProperty("--app-accent-text", accent.text);
    document.documentElement.style.setProperty("--app-accent-border", accent.border);
  }, [user]);

  if (user === undefined) return <LoadingScreen />;
  if (!user) return <LandingPage />;

  // role check for onboarding
  if (!user.role) return <OnboardingFlow user={user} />;

  const showMobileDashboardNav = !selectedClass;

  return (
    <div className="flex flex-col min-h-screen bg-transparent overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Main Content Area */}
        <main className={`flex-1 overflow-auto scrollbar-hide ${selectedClass ? 'p-0' : 'p-4 sm:p-6 md:p-12'} ${showMobileDashboardNav ? "pb-24 md:pb-0" : ""}`}>
          <div className={`max-w-7xl mx-auto min-h-full ${showMobileDashboardNav ? "pb-16 md:pb-0" : ""}`}>
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              {activePage === "settings" ? (
                <SettingsPage
                  user={user}
                  onBack={() => setActivePage("dashboard")}
                  onSignOut={() => {
                    void signOut();
                  }}
                  theme={theme}
                  onThemeChange={onThemeChange}
                />
              ) : (
                <ClassDashboard
                  user={user}
                  classes={classes}
                  selectedClass={selectedClass}
                  setSelectedClass={setSelectedClass}
                  onOpenSettings={() => setActivePage("settings")}
                />
              )}
            </div>
          </div>
        </main>
      </div>
      {showMobileDashboardNav && (
        <nav
          className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-3 right-3 z-50 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl p-2 shadow-[0_10px_30px_rgba(15,23,42,0.14)]"
          aria-label="Mobile navigation"
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActivePage("dashboard")}
              aria-label="Home"
              title="Home"
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-colors ${activePage === "dashboard" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
            >
              <House className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage("settings")}
              aria-label="Settings"
              title="Settings"
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-colors ${activePage === "settings" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
      <BookMascot mood="happy" size={96} label="Pagey loading" />
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">EduOS</h2>
        <div className="flex gap-1 justify-center">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

function OnboardingFlow({ user }: { user: any }) {
  const setUserRole = useMutation(api.myFunctions.updateUserRole);

  console.log("Onboarding for:", user.email);

  const handleRoleSelect = async (role: "student" | "teacher") => {
    await setUserRole({ role });
  };

  return (
    <div className="h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
        <button
          type="button"
          className="bg-white p-10 rounded-md border border-slate-200 flex flex-col justify-center items-center text-center space-y-6 group hover:border-emerald-500 transition-all cursor-pointer relative w-full"
          onClick={() => {
            void handleRoleSelect("teacher");
          }}
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Presentation className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">Manage classrooms and guide students.</p>
          </div>
          <span className="bg-emerald-600 text-white px-6 py-2.5 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm">
            Select Role
          </span>
        </button>

        <button
          type="button"
          className="bg-white p-10 rounded-md border border-slate-200 flex flex-col justify-center items-center text-center space-y-6 group hover:border-emerald-500 transition-all cursor-pointer relative w-full"
          onClick={() => {
            void handleRoleSelect("student");
          }}
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">Join classes and complete paths.</p>
          </div>
          <span className="bg-emerald-600 text-white px-6 py-2.5 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm">
            Select Role
          </span>
        </button>
      </div>
    </div>
  );
}

function LandingPage() {
  const { signIn } = useAuthActions();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [isAboutPage, setIsAboutPage] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("page") === "about";
  });

  const features = [
    {
      icon: Paperclip,
      title: "Upload Anything",
      description:
        "Upload assignments, lesson plans, PDFs, and resources in one place so every class stays organized.",
    },
    {
      icon: Globe,
      title: "Edit in the Browser",
      description:
        "Open and edit documents right inside EduOS with no installs, no switching tabs, and no extra tools.",
    },
    {
      icon: UsersRound,
      title: "Assignment Timers",
      description:
        "Give students built-in timers for focused work while teachers monitor progress live across the classroom.",
    },
    {
      icon: TrendingUp,
      title: "Designed for Focus",
      description:
        "A clean interface built for schools that keeps students on task and teachers in control.",
    },
  ];

  const comparisonRows = [
    ["✓ One workspace for class tasks", "✕ Multiple connected apps", "✕ Best inside Apple stack"],
    ["✓ Browser editing built in", "✕ Depends on Docs/Slides/Sheets", "✕ Limited built-in editing"],
    ["✓ Handles mixed file types", "✕ Optimized for Google formats", "✕ Best with Apple-native flow"],
    ["✓ Assignment timers included", "✕ Needs add-ons/workarounds", "✕ Not timer-first workflow"],
    ["✓ Built-in class messages", "✕ Messaging split across tools", "✕ Less central classroom messaging"],
    ["✓ Live progress analytics", "✕ Reporting across separate pages", "✕ Analytics less assignment-focused"],
    ["✓ Teacher activity insights", "✕ Depends on workspace integrations", "✕ Tied to Apple management data"],
    ["✓ Student-friendly simple UI", "✕ More menus for new users", "✕ Best for managed devices"],
    ["✓ Fast updates from school feedback", "✕ Large platform release cycles", "✕ Tied to Apple release pace"],
    ["✓ Lightweight setup for small schools", "✕ Works best with Google-wide rollout", "✕ Works best with Apple admin setup"],
  ];

  useEffect(() => {
    const handlePopState = () => {
      const about = new URLSearchParams(window.location.search).get("page") === "about";
      setIsAboutPage(about);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setIsDarkMode(media.matches);
    onChange();
    if ("addEventListener" in media) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    const legacyMedia = media as MediaQueryList & {
      addListener?: (listener: () => void) => void;
      removeListener?: (listener: () => void) => void;
    };
    legacyMedia.addListener?.(onChange);
    return () => legacyMedia.removeListener?.(onChange);
  }, []);

  const goToAboutPage = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", "about");
    window.history.pushState({}, "", url);
    setIsAboutPage(true);
  };

  const goToLandingPage = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("page");
    window.history.pushState({}, "", url);
    setIsAboutPage(false);
  };

  if (isAboutPage) {
    return (
      <div className={`marketing-landing min-h-screen bg-[#efefef] text-[#111111] ${isDarkMode ? "marketing-dark" : ""}`}>
        <header className="hidden md:block mx-auto w-full max-w-[1200px] px-5 md:px-12 pt-6 md:pt-5">
          <div className="flex items-center justify-between gap-4">
            <img src="/mascot/pagey-happy.png" alt="EduOS logo" className="h-9 w-auto object-contain" />
            <div className="flex items-center gap-3">
              <button
                onClick={goToLandingPage}
                className="rounded-full border border-[#cfcfcf] px-5 py-2 text-sm font-semibold text-[#222222]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  void signIn("google");
                }}
                className="rounded-full bg-[var(--app-accent)] px-6 py-2.5 text-sm font-semibold text-white"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] px-5 pb-28 md:pb-20 pt-12 md:pt-24 md:px-12">
          <div className="mx-auto mt-2 max-w-[980px] rounded-[24px] border border-[#d7d7d7] bg-[#f4f4f4] p-8 md:p-12">
            <article className="space-y-10 text-left">
              <section>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">Connect</p>
                <h2 className="mt-3 text-[36px] leading-[1.05] md:text-[48px]">Connect with us</h2>
                <p className="mt-4 text-[19px] leading-[1.6] text-[#525252] md:text-[22px]">
                  Mail us for bug reports, feature requests, school feedback, or partnership ideas.
                </p>
                <a
                  href="mailto:sriramramnath2011@gmail.com"
                  className="mt-5 inline-flex rounded-full bg-[var(--app-accent)] px-6 py-3 text-sm font-semibold text-white"
                >
                  Mail Us
                </a>
              </section>

              <section>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">Story</p>
                <p className="mt-4 text-[19px] leading-[1.6] text-[#525252] md:text-[22px]">
                  Many classroom tools are powerful but fragmented for daily use. EduOS is a student-built alternative
                  aiming for speed, clarity, and practical classroom defaults that work in real school conditions.
                </p>
              </section>

              <section>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">Core Capabilities</p>
                <ul className="mt-4 grid gap-3 text-[19px] leading-[1.5] text-[#4f4f4f] md:text-[21px]">
                  <li>• Assignment and file workflows in one interface</li>
                  <li>• Browser-based editing for common classroom documents</li>
                  <li>• Support for mixed file types from different school systems</li>
                  <li>• Simple UI focused on teacher and student day-to-day tasks</li>
                </ul>
              </section>

              <section>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">Project Status</p>
                <p className="mt-4 text-[19px] leading-[1.6] text-[#525252] md:text-[22px]">
                  EduOS is actively evolving and currently maintained by a student developer. Features are prioritized based
                  on real usage feedback, classroom friction points, and practical impact.
                </p>
              </section>

              <section>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6b6b6b]">Support and Feedback</p>
                <p className="mt-4 text-[19px] leading-[1.6] text-[#525252] md:text-[22px]">
                  If you find bugs, want to request features, or want to share classroom feedback, email:
                </p>
                <p className="mt-4 text-[20px] font-semibold md:text-[24px]">sriramramnath2011@gmail.com</p>
              </section>
            </article>
          </div>

          <div className="mt-12 flex justify-center">
            <button
              onClick={() => {
                void signIn("google");
              }}
              className="w-full max-w-[540px] rounded-full bg-[var(--app-accent)] py-4 text-sm font-semibold text-white"
            >
              Sign in with Google
            </button>
          </div>
        </main>
        <nav className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-3 right-3 z-50 rounded-2xl border border-[#d7d7d7] bg-[#f4f4f4]/95 backdrop-blur p-2 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={goToLandingPage}
              aria-label="Home"
              title="Home"
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-[#d7d7d7] px-4 py-3 text-xs font-semibold text-[#222222]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                void signIn("google");
              }}
              aria-label="Sign in"
              title="Sign in"
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-3 text-xs font-semibold text-white"
            >
              <LogIn className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className={`marketing-landing min-h-screen bg-[#efefef] text-[#111111] ${isDarkMode ? "marketing-dark" : ""}`}>
      <header className="hidden md:block sticky top-0 z-40 border-b border-[#d8d8d8] bg-[#efefef]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between gap-4 px-5 py-3 md:px-12">
          <img src="/mascot/pagey-happy.png" alt="EduOS logo" className="h-9 w-auto object-contain" />
          <nav className="hidden md:flex items-center gap-12 text-[15px] font-medium">
            <a href="#benefits">Benefits</a>
            <a href="#why">Why us?</a>
            <a href="#contact">Contact Us</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={goToAboutPage}
              className="rounded-full border border-[#cfcfcf] px-5 py-2 text-sm font-semibold text-[#222222]"
            >
              Connect With Us
            </button>
            <button
              onClick={() => {
                void signIn("google");
              }}
              className="rounded-full bg-[var(--app-accent)] px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </header>

      <section id="hero" className="mx-auto w-full max-w-[1520px] px-5 md:px-12 pt-8 md:pt-16">
        <h1 className="mx-auto max-w-[1320px] text-center text-[52px] leading-[0.95] tracking-[-0.03em] md:text-[108px]">
          A school workspace built
          <br />
          for real classrooms.
        </h1>

        <div className="relative mt-10 md:mt-16">
          <div className="absolute left-0 right-0 bottom-0 h-[42%] rounded-[24px] bg-[var(--app-accent)] opacity-30" />
          <img
            src="/assets/Phone+Tablet.png"
            alt="EduOS preview"
            className="relative z-10 mx-auto w-full max-w-[1120px] rounded-[24px]"
          />
        </div>
      </section>

      <section id="benefits" className="mx-auto w-full max-w-[1520px] px-5 md:px-12 pt-14 md:pt-16">
        <div className="h-px w-full bg-[#d9d9d9]" />
        <p className="mt-12 text-center text-[14px] tracking-[0.08em] text-[#6a7558]">Benefits</p>
        <h2 className="mx-auto mt-6 max-w-[1320px] text-center text-[52px] leading-[1.02] tracking-[-0.02em] md:text-[69px]">
          EduOS keeps assignments, files, and editing in one simple space, without the clutter or heavy software.
        </h2>
        <p className="mt-8 text-center text-[24px] text-[#7a7a7a]">
          EduOS gives teachers clear progress visibility without data overload.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="border-t border-[#dddddd] pt-8 text-center">
              <Icon className="mx-auto h-5 w-5" strokeWidth={1.8} />
              <h3 className="mt-6 text-[31px] leading-[1.1] tracking-[-0.015em]">{title}</h3>
              <p className="mx-auto mt-5 max-w-[320px] text-[24px] leading-[1.35] text-[#666666]">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 md:mt-16 overflow-hidden rounded-[28px]">
          <img
            src="/assets/background.png"
            alt="Landscape"
            className="h-[360px] w-full object-cover md:h-[760px]"
          />
        </div>
      </section>

      <section id="why" className="mx-auto w-full max-w-[1520px] px-5 md:px-12 pt-14 md:pt-20">
        <div className="overflow-hidden rounded-[24px] border border-[#d7d7d7] bg-[#efefef]">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="rounded-t-[24px] md:rounded-none md:rounded-l-[24px] border-b border-[#d7d7d7] bg-[#f3f3f3] md:border-b-0 md:shadow-[0_0_0_1px_#dddddd,0_8px_20px_rgba(0,0,0,0.05)]">
              <h3 className="px-8 py-8 text-center text-[43px]">EduOS</h3>
            </div>
            <div className="border-b border-[#d7d7d7] px-8 py-8 text-center text-[43px] md:border-b-0 md:border-l">Google Classroom</div>
            <div className="px-8 py-8 text-center text-[43px] md:border-l">Apple Classroom</div>
          </div>
          {comparisonRows.map((row, index) => (
            <div key={index} className="grid grid-cols-1 border-t border-[#d7d7d7] md:grid-cols-3">
              <div className="px-8 py-8 text-[22px] md:border-r border-[#d7d7d7]">{row[0]}</div>
              <div className="px-8 py-8 text-[22px] md:border-r border-[#d7d7d7]">{row[1]}</div>
              <div className="px-8 py-8 text-[22px]">{row[2]}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto w-full max-w-[1520px] px-5 md:px-12 py-20 pb-28 md:pb-24 md:py-24">
        <div className="h-px w-full bg-[#d9d9d9]" />
        <div className="mx-auto max-w-[900px] pt-20 text-center">
          <h2 className="text-[56px] leading-[1] md:text-[72px]">Connect with us</h2>
          <p className="mx-auto mt-10 max-w-[760px] text-[21px] leading-[1.5] text-[#7a7a7a]">
            Schedule a quick call to see how EduOS can simplify classroom workflows for your school.
          </p>
          <button
            onClick={goToAboutPage}
            className="mt-10 w-full max-w-[740px] rounded-full bg-[var(--app-accent)] py-5 text-[15px] font-semibold text-white"
          >
            Connect With Us ›
          </button>
        </div>
      </section>
      <nav className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-3 right-3 z-50 rounded-2xl border border-[#d7d7d7] bg-[#f4f4f4]/95 backdrop-blur p-2 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
        <div className="grid grid-cols-4 gap-2">
          <a
            href="#benefits"
            aria-label="Benefits"
            title="Benefits"
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white border border-[#d7d7d7] px-2 py-2.5 text-[10px] font-semibold text-[#222222]"
          >
            <House className="w-4 h-4" />
          </a>
          <a
            href="#why"
            aria-label="Why"
            title="Why"
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white border border-[#d7d7d7] px-2 py-2.5 text-[10px] font-semibold text-[#222222]"
          >
            <Info className="w-4 h-4" />
          </a>
          <a
            href="#contact"
            aria-label="Contact"
            title="Contact"
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white border border-[#d7d7d7] px-2 py-2.5 text-[10px] font-semibold text-[#222222]"
          >
            <Paperclip className="w-4 h-4" />
          </a>
          <button
            onClick={() => {
              void signIn("google");
            }}
            aria-label="Sign in"
            title="Sign in"
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[var(--app-accent)] px-2 py-2.5 text-[10px] font-semibold text-white"
          >
            <LogIn className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </div>
  );
}
