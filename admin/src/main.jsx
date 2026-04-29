import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";

function ClerkWithRouter() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)}
    >
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ClerkWithRouter />
  </BrowserRouter>,
);
