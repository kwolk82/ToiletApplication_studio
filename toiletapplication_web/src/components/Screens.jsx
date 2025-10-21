import React from "react";
import screen1 from "../assets/screen1.jpg";
import screen2 from "../assets/screen2.jpg";
import screen3 from "../assets/screen3.jpg";

export default function Screens() {
  const screenshots = [screen1, screen2, screen3];

  return (
    <section id="screens" className="section alt">
      <div className="container">
        <h2>스크린샷</h2>
        <p className="muted">앱의 실제 화면을 확인해 보세요.</p>
        <div className="grid three">
          {screenshots.map((src, i) => (
            <div key={i} className="shot">
              <img src={src} alt={`앱 스크린샷 ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
