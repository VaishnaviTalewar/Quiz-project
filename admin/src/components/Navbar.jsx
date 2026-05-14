import React, { useState, useEffect, useRef } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { useNavigate, useLocation } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import { List, Home, X, Menu } from "lucide-react";

const Navbar = ({ logoSrc = null, siteName = "Tech Quiz Master" }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const navRef = useRef(null);

  // Navigate helper
  const goTo = (path) => {
  if (mobileOpen) {
    setMobileOpen(false);

    requestAnimationFrame(() => {
      setTimeout(() => {
        navigate(path);
      }, 50);
    });
  } else {
    navigate(path);
  }
};

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;

    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpen]);

  // Close menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Prevent body scroll when menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

  // Save clerk token
  useEffect(() => {
    const saveToken = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();

        if (token) {
          localStorage.setItem("clerkToken", token);
        }
      } catch (err) {
        console.error("Failed to get Clerk Token:", err);
      }
    };

    saveToken();
  }, [isSignedIn, getToken]);

  return (
    <nav className={navbarStyles.nav} ref={navRef}>
      <div className={navbarStyles.container}>
        <div className={navbarStyles.innerContainer}>
          
          {/* LEFT */}
          <div className={navbarStyles.homeButton}>
            <button
              type="button"
              onClick={() => goTo("/dashboard")}
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
                <span className={navbarStyles.siteName}>
                  {siteName}
                </span>

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
                  onClick={() => goTo("/dashboard")}
                  className={navbarStyles.dashboardButton}
                >
                  <Home className={navbarStyles.dashboardIcon} />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => goTo("/list")}
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

            {/* Desktop Auth */}
            <div className={navbarStyles.desktopRightContent}>
              {isSignedIn ? (
                <div className="flex items-center gap-3">

                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9",
                      },
                    }}
                  />

                  <SignOutButton>
                    <button
                      type="button"
                      className={navbarStyles.buttonAlt}
                    >
                      Logout
                    </button>
                  </SignOutButton>

                </div>
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className={navbarStyles.buttonBase}
                  >
                    Login
                  </button>
                </SignInButton>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            {location.pathname !== "/list" && (
              <div className={navbarStyles.mobileMenuContainer}>
                <button
                  type="button"
                  onClick={() => setMobileOpen((prev) => !prev)}
                  className={navbarStyles.hamburgerButton}
                >
                  {mobileOpen ? (
                    <X className={navbarStyles.xIcon} />
                  ) : (
                    <Menu className={navbarStyles.menuIcon} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen ? (
        <div className={navbarStyles.mobileOverlay}>
          
          {/* BACKDROP */}
          <div
            className={navbarStyles.mobileBackdrop}
            onClick={() => setMobileOpen(false)}
          />

          {/* PANEL */}
          <div
            className={navbarStyles.mobilePanel}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className={navbarStyles.mobileNav}>

              <SignedIn>

                <button
                  onClick={() => goTo("/dashboard")}
                  className={navbarStyles.mobileMenuActionButton}
                >
                  Dashboard
                </button>

                <button
                  onClick={() => goTo("/list")}
                  className={navbarStyles.mobileMenuActionButton}
                >
                  List Quiz
                </button>

                <div className={navbarStyles.mobileMenuUserRow}>
                  
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9",
                      },
                    }}
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Signed in
                  </span>
                </div>

                <SignOutButton>
                  <button
                    type="button"
                    className={
                      navbarStyles.mobileMenuActionButtonSecondary
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    Logout
                  </button>
                </SignOutButton>

              </SignedIn>

              <SignedOut>

                <SignInButton mode="modal">
                  <button
                    type="button"
                    className={navbarStyles.mobileMenuActionButton}
                  >
                    Login
                  </button>
                </SignInButton>

              </SignedOut>

            </nav>
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;