import React from "react";
import "./styles/app.css";

import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Features from "./components/Features.jsx";
import Screens from "./components/Screens.jsx";
import Download from "./components/Download.jsx";
import FAQ from "./components/FAQ.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  const features = [
    { title: "가까운 화장실 탐색", desc: "현재 위치 기반으로 가장 가까운 공중화장실을 빠르게 안내합니다." },
    { title: "한눈에 보는 편의정보", desc: "남/녀, 장애인, 아기 케어 등 표시." },
    { title: "경로 안내", desc: "도보/차량 길찾기 외부 지도 연동." },
    { title: "오프라인 즐겨찾기", desc: "자주 가는 장소를 저장해 오프라인 확인." },
  ];

  const faqs = [
    { q: "앱은 무료인가요?", a: "기본 기능은 무료입니다. 고급 기능은 선택형으로 제공될 수 있어요." },
    { q: "데이터는 어떻게 사용되나요?", a: "위치 정보는 길찾기/탐색에만 사용하고 서버에 저장하지 않습니다." },
    { q: "지원 기기/OS는?", a: "iOS 15+, Android 8.0+ 권장." },
  ];

  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <Features items={features} />
        <Screens />
        <Download />
        <FAQ items={faqs} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
