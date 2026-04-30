import React, { useRef, useState, useEffect } from "react";
import {
  backgroundDesigns,
  svgPatterns,
  navbarStyles,
} from "../assets/dummyStyles.js";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton, UserButton } from "@clerk/react";
import { X, Menu, User } from "lucide-react";

const NavbarCompo = ({ logoSrc, quizType = "default" }) => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const navRef = useRef(null);
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);

  const design = backgroundDesigns[quizType] || backgroundDesigns.default;
  const pattern = svgPatterns[design.pattern] || svgPatterns.abstract;

  const goTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  // ✅ close the menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleDocClick = (e) => {
      if (
        navRef.current?.contains(e.target) ||
        menuBtnRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }

      setMenuOpen(false);
    };

    document.addEventListener("click", handleDocClick, { capture: true });

    return () =>
      document.removeEventListener("click", handleDocClick, { capture: true });
  }, [menuOpen]);

  return (
    <div className={navbarStyles.container}>
      <nav
        ref={navRef}
        className={`${navbarStyles.nav} ${design.borderColor}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={navbarStyles.patternContainer}>
          <div
            className={navbarStyles.patternLayer}
            style={{
              backgroundImage: pattern,
              ...navbarStyles.backgroundPatternStyle,
            }}
          />
        </div>

        <div className={navbarStyles.innerContainer}>
          <div className={navbarStyles.flexContainer}>
            {/* LOGO */}
            <div className={navbarStyles.logoSection}>
              <button
                className={navbarStyles.logoButton}
                onClick={() => goTo("/")}
              >
                <img
                  src={
                    logoSrc ||
                    "https://cdn-icons-png.flaticon.com/128/5806/5806364.png"
                  }
                  alt="logo"
                  className={navbarStyles.logoImage}
                />
              </button>
            </div>

            {/* TITLE */}
            <div className={navbarStyles.titleContainer}>
              <div className={navbarStyles.titleWrapper}>
                <div className={navbarStyles.titleBox}>
                  <h1 className={navbarStyles.titleText(design.textColor)}>
                    <span className={navbarStyles.titleGradient}>
                      Tech Quiz Master
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            {/* DESKTOP BUTTONS */}
            <div className={navbarStyles.desktopButtons}>
              {!isSignedIn && (
                <SignInButton mode="modal">
                  <button
                    className={navbarStyles.buttonBase(design.accentColor)}
                  >
                    My Result
                  </button>
                </SignInButton>
              )}

              {isSignedIn && (
                <button
                  onClick={() => goTo("/result")}
                  className={navbarStyles.buttonBase(design.accentColor)}
                >
                  My Result
                </button>
              )}

              {!isSignedIn && (
                <SignInButton mode="modal">
                  <button
                    className={navbarStyles.buttonBase(design.accentColor)}
                  >
                    Login
                  </button>
                </SignInButton>
              )}

              {isSignedIn && (
                <div className="flex items-center justify-center ml-3">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9",
                      },
                    }}
                  />
                </div>
              )}
            </div>

            {/* MOBILE TOGGLE */}
            <button
              ref={menuBtnRef}
              className={`lg:hidden ${navbarStyles.mobileMenuButton(design.accentColor)}`}
              onClick={() => setMenuOpen((s) => !s)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/**Mobile menu */}
          {menuOpen && (
            <div ref={menuRef} className={navbarStyles.mobileMenuWrapper}>
              {!isSignedIn && (
                <SignInButton mode="modal">
                  <button
                    className={navbarStyles.buttonBase(design.accentColor)}
                  >
                    My Results
                  </button>
                </SignInButton>
              )}

              {isSignedIn && (
                <button
                  onClick={() => goTo("/result")}
                  className={navbarStyles.buttonBase(design.accentColor)}
                >
                  My Results
                </button>
              )}

              {!isSignedIn && (
                <SignInButton mode="modal">
                  <button
                    className={navbarStyles.buttonBase(design.accentColor)}
                  >
                    Login
                  </button>
                </SignInButton>
              )}

              {isSignedIn ? (
                <UserButton />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                  👤
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavbarCompo;
