import React, { useState, useEffect, useRef } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import { List, Home, User, X, Menu } from "lucide-react";

const Navbar = ({
  logoSrc = null,
  siteName = "Tech Quiz Master",
  rightContent = null,
  onNavigate = null,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const navigate = useNavigate();

  const prevSignedInRef = useRef(false);

  // ESC close
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // mobile lock
  useEffect(() => {
    const onResize = () => window.innerWidth >= 768 && setMobileOpen(false);

    window.addEventListener("resize", onResize);

    const prevOverflow = document.body.style.overflow;
    if (mobileOpen) document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow || "";
    };
  }, [mobileOpen]);

  const handleNavigate = (href) => {
    setMobileOpen(false);

    if (onNavigate) return onNavigate(href);

    try {
      navigate(href);
    } catch {
      window.location.href = href;
    }
  };

  //  TOKEN SAVE
  useEffect(() => {
    async function saveToken() {
      if (!isSignedIn) return;

      try {
        const token = await getToken();

        if (token) {
          localStorage.setItem("clerkToken", token);
          console.log("Clerk token saved");
        }
      } catch (err) {
        console.error("Failed to get Clerk Token:", err);
      }
    }

    saveToken();
  }, [isSignedIn, getToken]);

  return (
    <nav className={navbarStyles.nav}>
      <div className={navbarStyles.container}>
        <div className={navbarStyles.innerContainer}>
          
          {/* LEFT */}
          <div className={navbarStyles.homeButton}>
            <button
              onClick={() => handleNavigate("/dashboard")}
              className={navbarStyles.homeButton}
            >
              <div className={navbarStyles.logoWrapper}>
                <img
                  src={
                    logoSrc ||
                    "https://cdn-icons-png.flaticon.com/128/5806/5806364.png"
                  }
                  alt="logo"
                  className={navbarStyles.logoImg}
                />
              </div>

              <div className={navbarStyles.siteNameWrapper}>
                <span className={navbarStyles.siteName}>{siteName}</span>
                <span className={navbarStyles.siteSubtitle}>
                  Learning Platform
                </span>
              </div>
            </button>
          </div>

          {/* CENTER */}
          <SignedIn>
            <div className={navbarStyles.desktopCenterContainer}>
              <div className={navbarStyles.desktopCenterInner}>
                <button
                  onClick={() => handleNavigate("/dashboard")}
                  className={navbarStyles.dashboardButton}
                >
                  <Home className={navbarStyles.dashboardIcon} />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavigate("/list")}
                  className={navbarStyles.listButton}
                >
                  <List className={navbarStyles.listIcon} />
                  <span>List Quiz</span>
                </button>
              </div>
            </div>
          </SignedIn>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <div className={navbarStyles.desktopRightContent}>
              <div className={navbarStyles.profileGroup}>
                
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className={navbarStyles.profileButton}>
                      <User className={navbarStyles.profileIcon} />
                      <span>My Profile</span>
                    </button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9",
                      },
                    }}
                  />
                </SignedIn>

              </div>
            </div>

            {/* MOBILE BUTTON */}
            <div className={navbarStyles.mobileMenuContainer}>
              <button
                onClick={() => setMobileOpen((s) => !s)}
                className={navbarStyles.hamburgerButton}
              >
                {mobileOpen ? (
                  <X className={navbarStyles.xIcon} />
                ) : (
                  <Menu className={navbarStyles.menuIcon} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className={navbarStyles.mobileOverlay}>
          <div
            onClick={() => setMobileOpen(false)}
            className={navbarStyles.mobileBackdrop}
          />

          <div
            className={navbarStyles.mobilePanel}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className={navbarStyles.mobileNav}>
              
              <SignedIn>
                <button
                  onClick={() => handleNavigate("/dashboard")}
                  className={navbarStyles.mobileNavButton}
                >
                  <Home className={navbarStyles.mobileNavIcon} />
                  <div>Dashboard</div>
                </button>

                <button
                  onClick={() => handleNavigate("/list")}
                  className={navbarStyles.mobileNavButton}
                >
                  <List className={navbarStyles.mobileNavIcon} />
                  <div>List Quiz</div>
                </button>

                <div className={navbarStyles.mobileNavButton}>
                  <UserButton />
                </div>
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className={navbarStyles.mobileNavButton}>
                    <User className={navbarStyles.mobileNavIcon} />
                    <div>Sign In</div>
                  </button>
                </SignInButton>
              </SignedOut>

            </nav>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;