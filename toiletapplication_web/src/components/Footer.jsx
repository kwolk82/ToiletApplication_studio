import React from "react";
import Logo from "./Logo.jsx";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="brand-mini"><Logo small /> © {new Date().getFullYear()} 화장실 어플</div>
        <div className="footer-links">
          <a href="#">개인정보처리방침</a>
          <a href="#">이용약관</a>
          <a href="#top">위로가기</a>
        </div>
      </div>
    </footer>
  );
}
