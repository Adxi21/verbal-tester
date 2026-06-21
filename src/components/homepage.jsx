import { useUser, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from '../supabaseClient';

export default function Homepage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [controlType, setControlType] = useState(null);

  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('control_type')
        .eq('email', user.emailAddresses[0].emailAddress)
        .single();

      if (!error && data) {
        setIsAdmin(true);
        setControlType(data.control_type);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[var(--bg-color)] text-[var(--text-color)]">

      {/* THEME VARIABLES */}

      <style>{`
  /* LIGHT THEME — Warm + Spiritual */
  :root {
    --bg-color: #FFF8E6; 
    --text-color: #4B3A2F;

    --card-bg: rgba(255, 255, 255, 0.55);
    --card-border: rgba(255, 200, 120, 0.35);
    --header-bg: rgba(255, 250, 235, 0.55);

    --option-1: #F4C06A; 
    --option-2: #D7A8F7;
    --option-3: #F7A8C6;
    --option-4: #A8E4C0;
  }

  /* DARK THEME — Modern + Eye Friendly */
  .dark {
    --bg-color: #121212;
    --text-color: #E8E8E8;

    --card-bg: rgba(24, 24, 24, 0.55);
    --card-border: rgba(255, 255, 255, 0.08);
    --header-bg: rgba(30, 30, 30, 0.45);

    --option-1: #F0B05A;
    --option-2: #A178F5;
    --option-3: #FF6FA5;
    --option-4: #32C88A;
  }
`}</style>
      

      {/* TOP RIGHT CONTROLS */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-3">
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 rounded-xl shadow-md backdrop-blur-md bg-red-500/20 border border-red-300/30 hover:scale-105 transition-transform text-red-700 dark:text-red-300 font-medium"
          >
            🔐 Admin Panel
          </button>
        )}
        <button
          id="themeToggle"
          className="px-3 py-2 rounded-xl shadow-md backdrop-blur-md bg-[var(--card-bg)] border border-[var(--card-border)] hover:scale-105 transition-transform"
          onClick={() => document.documentElement.classList.toggle('dark')}
        >
          🌓
        </button>
        <div className="backdrop-blur-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-1">
          <UserButton />
        </div>
      </div>

      {/* HEADER */}
      <header className="w-full py-6 backdrop-blur-xl bg-[var(--header-bg)] border-b border-[var(--card-border)]">
        <h1 className="text-center text-3xl font-extrabold tracking-wide">
          Rajaram Gurukul
        </h1>
      </header>

      {/* MAIN */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-center text-4xl font-bold mb-4">
          Welcome, {user?.firstName || "User"}!
        </h2>
        <p className="text-center text-lg opacity-80 mb-10">
          Choose what you’d like to do today
        </p>

        {/* OPTIONS (4×1 layout) */}
        <div className="space-y-6">

          {/* Option 1 */}
          <div
            className="p-6 rounded-3xl shadow-xl border border-[var(--card-border)] backdrop-blur-xl bg-[var(--card-bg)] transition hover:scale-[1.02] hover:shadow-2xl"
            style={{ backgroundImage: "linear-gradient(135deg, var(--option-1) 30%, transparent)" }}
          >
            <h3 className="text-2xl font-semibold mb-2">Register For Utsav</h3>
            <p className="opacity-75 mb-3">Join upcoming spiritual events.</p>
            <button 
              onClick={() => navigate('/registrations')}
              className="px-5 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 transition"
            >
              Explore
            </button>
          </div>

          {/* Option 2 */}
          <div
            className="p-6 rounded-3xl shadow-xl border border-[var(--card-border)] backdrop-blur-xl bg-[var(--card-bg)] transition hover:scale-[1.02] hover:shadow-2xl"
            style={{ backgroundImage: "linear-gradient(135deg, var(--option-2) 30%, transparent)" }}
          >
            <h3 className="text-2xl font-semibold mb-2">View Utsav Location</h3>
            <p className="opacity-75 mb-3">Find the venue on map.</p>
            <button 
              onClick={() => navigate('/location')}
              className="px-5 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 transition"
            >
              View Map
            </button>
          </div>

          {/* Option 3 */}
          <div
            className="p-6 rounded-3xl shadow-xl border border-[var(--card-border)] backdrop-blur-xl bg-[var(--card-bg)] transition hover:scale-[1.02] hover:shadow-2xl"
            style={{ backgroundImage: "linear-gradient(135deg, var(--option-3) 30%, transparent)" }}
          >
            <h3 className="text-2xl font-semibold mb-2">Place Order For Books</h3>
            <p className="opacity-75 mb-3">Order spiritual books delivered.</p>
            <button 
              onClick={() => navigate('/shop-books')}
              className="px-5 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 transition"
            >
              Order
            </button>
          </div>

          {/* Option 4 */}
          <div
            className="p-6 rounded-3xl shadow-xl border border-[var(--card-border)] backdrop-blur-xl bg-[var(--card-bg)] transition hover:scale-[1.02] hover:shadow-2xl"
            style={{ backgroundImage: "linear-gradient(135deg, var(--option-4) 30%, transparent)" }}
          >
            <h3 className="text-2xl font-semibold mb-2">Read Books Online</h3>
            <p className="opacity-75 mb-3">This feature will be coming soon.</p>
            <button className="px-5 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 transition opacity-50 cursor-not-allowed">
              Coming Soon
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}