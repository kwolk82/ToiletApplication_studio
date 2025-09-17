import React from "react";
import Sparkle from "./Sparkle.jsx";

export default function Features({ items }) {
  return (
    <section id="features" className="section">
      <div className="container">
        <h2>핵심 기능</h2>
        <p className="muted">사용자의 실제 이용 시나리오에 맞춘 기능들입니다.</p>
        <div className="grid four">
          {items.map((f) => (
            <div key={f.title} className="card">
              <div className="icon"><Sparkle /></div>
              <h3>{f.title}</h3>
              <p className="muted small">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
