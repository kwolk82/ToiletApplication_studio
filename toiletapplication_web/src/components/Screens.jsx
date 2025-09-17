import React from "react";

export default function Screens() {
  return (
    <section id="screens" className="section alt">
      <div className="container">
        <h2>스크린샷</h2>
        <p className="muted">앱의 실제 화면을 확인해 보세요.</p>
        <div className="grid three">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shot">
              <img src={`https://picsum.photos/seed/toiletapp_${i}/800/1600`} alt={`앱 스크린샷 ${i}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
