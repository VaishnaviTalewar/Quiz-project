import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Lock } from "lucide-react";

const Hero = () => {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="relative h-screen w-screen flex items-center justify-center overflow-hidden px-4 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
      
      {/* Floating blobs */}
      <div className="absolute w-72 h-72 bg-pink-300 opacity-30 rounded-full blur-3xl top-[-50px] left-[-50px] animate-pulse" />
      <div className="absolute w-72 h-72 bg-purple-300 opacity-30 rounded-full blur-3xl bottom-[-60px] right-[-40px] animate-pulse" />

      {/* Card */}
      <div className="relative text-center px-8 py-10 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl max-w-lg w-full animate-[scaleIn_0.5s_ease-out]">
        
        {/* Icon */}
        <div className="relative inline-flex mb-5 animate-[float_4s_ease-in-out_infinite]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 blur-md opacity-70" />

          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white text-indigo-600 shadow-md">
            <GraduationCap size={36} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-gray-800 mb-2 animate-[fadeUp_0.6s_ease-out]">
          Welcome 👋
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-sm mb-6 leading-relaxed animate-[fadeUp_0.8s_ease-out]">
          Tech Quiz Master helps you manage quizzes, users & analytics effortlessly ✨
        </p>

        {/* CTA */}
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-sm font-medium shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 animate-[fadeUp_1s_ease-out]"
        >
          <Lock size={16} />
          Go to Dashboard
        </Link>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-4 animate-[fadeUp_1.2s_ease-out]">
          Secure admin access 🔐
        </p>
      </div>
    </div>
  );
};

export default Hero;