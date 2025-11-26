import { useEffect, useState, useRef } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

export default function LandingPage() {
  const fullText = "Rajaram Gurukul";
  const [typed, setTyped] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("rg-dark-mode") === "true";
    } catch (e) {
      return false;
    }
  });

  const typedRef = useRef({ index: 0, timeoutId: null });

  useEffect(() => {
    const step = () => {
      const { index } = typedRef.current;
      if (index <= fullText.length - 1) {
        typedRef.current.index = index + 1;
        setTyped(fullText.slice(0, typedRef.current.index));
        const delay = 45 + Math.floor(Math.random() * 60);
        typedRef.current.timeoutId = setTimeout(step, delay);
      } else {
        setIsTyping(false);
        clearTimeout(typedRef.current.timeoutId);
      }
    };

    setTyped("");
    typedRef.current.index = 0;
    setIsTyping(true);
    typedRef.current.timeoutId = setTimeout(step, 250);

    return () => {
      if (typedRef.current.timeoutId) clearTimeout(typedRef.current.timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("rg-dark-mode", dark ? "true" : "false");
    } catch (e) {}
    if (dark) document.documentElement.classList.add("rg-dark");
    else document.documentElement.classList.remove("rg-dark");
  }, [dark]);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ease-out ${
        dark
          ? "bg-[#0f1724] text-white"
          : "bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900"
      }`}
    >
      {/* DARK MODE TOGGLE TOP CORNER */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setDark((s) => !s)}
          className={`w-10 h-10 flex items-center justify-center rounded-lg border transition duration-200 shadow-sm hover:scale-105 ${
            dark
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white border-gray-200 text-gray-800"
          }`}
          aria-label="Toggle dark mode"
        >
          {dark ? (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.76 4.84l-1.8-1.79L3.17 4.84 4.96 6.63 6.76 4.84zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zM20.84 4.84l-1.79-1.79-1.8 1.79 1.79 1.79 1.8-1.79zM17 13a4 4 0 11-8 0 4 4 0 018 0zM21 11h2v-2h-2v2zM6.76 19.16l-1.8 1.79 1.79 1.79 1.8-1.79-1.79-1.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex flex-col items-center justify-center flex-1 px-4 py-20 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">Welcome to</h1>

        <div className="mb-8 flex justify-center">
          <h2
            className={`text-4xl md:text-6xl font-extrabold tracking-tight leading-tight ${
              dark ? "text-indigo-300" : "text-indigo-700"
            }`}
          >
            <span>{typed}</span>
            <span
              className={`inline-block ml-1 ${
                isTyping ? "animate-blink" : "opacity-0"
              }`}
              style={{ width: 18 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 28,
                  borderRadius: 1,
                  background: dark
                    ? "rgba(148,163,184,0.95)"
                    : "rgba(79,70,229,0.9)",
                }}
              />
            </span>
          </h2>
        </div>

        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Embark on your learning journey. Join our community of learners and unlock your potential.
        </p>

        <div
          className={`max-w-md w-full rounded-2xl p-8 shadow-2xl border backdrop-blur-xl ${
            dark
              ? "bg-[#07101a]/60 border-white/10"
              : "bg-white/40 border-white/50"
          }`}
        >
          <h3 className="text-2xl font-semibold mb-3">Get Started Today</h3>
          <p className="text-sm mb-6 opacity-80">
            To proceed with <span className="font-semibold text-indigo-500">Utsavs</span>, please sign in or sign up.
          </p>

          <div className="space-y-4">
            <SignUpButton>
              <button className="w-full px-6 py-3 rounded-xl font-semibold shadow-md bg-indigo-600 text-white hover:bg-indigo-700 transition">
                Sign Up
              </button>
            </SignUpButton>

            <SignInButton>
              <button
                className={`w-full px-6 py-3 rounded-xl font-semibold border-2 transition ${
                  dark
                    ? "border-indigo-500 text-indigo-200 hover:bg-white/5"
                    : "border-indigo-600 text-indigo-700 bg-white hover:bg-indigo-50"
                }`}
              >
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </main>

      <footer className={`py-6 text-center text-sm ${dark ? "opacity-70" : "text-gray-600"}`}>
        © {new Date().getFullYear()} Rajaram Gurukul. All rights reserved.
      </footer>

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.15; }
          100% { opacity: 1; }
        }
        .animate-blink {
          animation: blink 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}