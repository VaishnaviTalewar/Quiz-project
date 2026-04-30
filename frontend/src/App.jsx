import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MyResultPage from "./pages/MyResultPage";
import { useAuth } from "@clerk/react";

const App = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/result"
        element={
          isSignedIn ? <MyResultPage /> : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
};

export default App;