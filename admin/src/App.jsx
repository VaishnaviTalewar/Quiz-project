import React from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { useUser } from "@clerk/clerk-react";
import ListPage from "./pages/ListPage.jsx";

// to protect the routes
function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
        {/* Floating Blobs */}
        <div className="absolute w-72 h-72 bg-pink-300 opacity-30 rounded-full blur-3xl top-[-50px] left-[-50px] animate-pulse" />
        <div className="absolute w-72 h-72 bg-purple-300 opacity-30 rounded-full blur-3xl bottom-[-60px] right-[-40px] animate-pulse" />
        <div className="absolute w-60 h-60 bg-indigo-300 opacity-20 rounded-full blur-3xl top-[40%] left-[60%] animate-pulse" />

        {/* Card */}
        <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl p-8 text-center animate-[scaleIn_0.5s_ease-out]">
          {/* Cute Icon */}
          <div className="text-5xl mb-4 animate-[floatSlow_4s_ease-in-out_infinite]">
            🔐
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-2 animate-[fadeUp_0.6s_ease-out]">
            Hey there! 👋
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-sm mb-6 leading-relaxed animate-[fadeUp_0.8s_ease-out]">
            You need to sign in first to unlock your dashboard ✨
          </p>

          {/* Button */}
          <Link
            to="/"
            state={{ from: location }}
            className="inline-block w-full px-5 py-3 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-sm font-medium shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 animate-[fadeUp_1s_ease-out]"
          >
            Take me Home 🏠
          </Link>

          {/* Footer text */}
          <p className="text-xs text-gray-400 mt-5 animate-[fadeUp_1.2s_ease-out]">
            We promise it’s worth it 💖
          </p>
        </div>
      </div>
    );
  }

  return children;
}

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/list" element={<RequireAuth>
          <ListPage/>
        </RequireAuth>}/>
      </Routes>
    </div>
  );
};

export default App;
