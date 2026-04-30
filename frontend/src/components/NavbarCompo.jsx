import React, { useRef, useState } from 'react'
import { backgroundDesigns, svgPatterns, navbarStyles } from "../assets/dummyStyles.js"
import { useNavigate } from 'react-router-dom'

const NavbarCompo = ({ logoSrc, quizType = "default" }) => {

    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false)
    const [isHovering, setIsHovering] = useState(false)

    const navRef = useRef(null)
    const menuBtnRef = useRef(null)
    const menuRef = useRef(null)

    const design = backgroundDesigns[quizType] || backgroundDesigns.default;
    const pattern = svgPatterns[design.pattern] || svgPatterns.abstract;
    
  return (
    <div className={navbarStyles.container}>
        <nav
          ref={navRef}
          className={`${navbarStyles.nav} ${design.borderColor}`}
          onMouseEnter={() => setIsHovering(true)}
        >

        </nav>
    </div>
  )
}

export default NavbarCompo