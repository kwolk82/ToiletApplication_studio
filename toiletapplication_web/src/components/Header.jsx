import React, { useState } from "react";
import Logo from "./Logo.jsx";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { href: "#features", label: "기능" },
    { href: "#screens", label: "스크린샷" },
    { href: "#download", label: "다운로드" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "문의" },
  ];

  return (
    <header className="header">
      <div className="container header-inner">
        <a href="#top" className="brand">
          <Logo />
          <span className="brand-name">화장실 어플</span>
        </a>
        <nav className="nav desktop-only">
          {links.map((l) => (
            <a key={l.href} className="nav-link" href={l.href}>{l.label}</a>
          ))}
        </nav>
        <button className="menu-button mobile-only" onClick={() => setMobileOpen(v => !v)}>
          메뉴
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-menu mobile-only">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="mobile-link" onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
