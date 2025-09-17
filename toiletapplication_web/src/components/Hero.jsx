import React from "react";
import Check from "./Check.jsx";

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1>가장 빠르게 찾는 </h1>
          <h1><span className="accent">가까운 화장실</span></h1>
          <p className="lead">길 위에서, 쇼핑몰에서, 축제 현장에서 — 딱 3초면 가까운 화장실이 보입니다.</p>
          <div className="cta-row">
            <a href="#download" className="btn primary">지금 설치하기</a>
            <a href="#features" className="btn outline">기능 보기</a>
          </div>
          <ul className="hero-points">
            <li><Check /> 광고 없음(계획)</li>
            <li><Check /> 길찾기 연동</li>
            <li><Check /> 편의 정보 제공</li>
            <li><Check /> 즐겨찾기 저장</li>
          </ul>
        </div>

        <div className="hero-shot">
          <div className="device-frame">
            <img
              src="https://images.unsplash.com/photo-1529927066849-66e32a802f89?q=80&w=1200&auto=format&fit=crop"
              alt="앱 스크린샷 프리뷰"
            />
          </div>
          <div className="blob blob-a" />
          <div className="blob blob-b" />
        </div>
      </div>
    </section>
  );
}
