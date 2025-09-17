import React from "react";

export default function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container narrow">
        <h2>문의하기</h2>
        <p className="muted">기능 제안, 제휴, 버그 제보 등 아래 이메일로 연락 주세요.</p>
        <div className="card">
          <p className="small">이메일: <a href="mailto:toiletapplication@gmail.com">toiletapplication@gmail.com</a></p>
          <p className="small muted">팀: 화장실 어플 개발팀 (6인)</p>
        </div>
      </div>
    </section>
  );
}
