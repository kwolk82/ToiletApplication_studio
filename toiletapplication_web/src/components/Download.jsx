import React from "react";

export default function Download() {
  return (
    <section id="download" className="section">
      <div className="container dl-grid">
        <div className="dl-copy">
          <h2>지금 다운로드</h2>
          <p className="muted">앱 스토어 출시 후 아래 버튼이 활성화됩니다. 현재는 테스트 APK(iOS TestFlight)를 통해 체험 가능합니다.</p>
          <div className="cta-row">
            <a href="#" className="btn outline">Google Play</a>
            <a href="#" className="btn outline">App Store</a>
            <a href="#" className="btn dark">APK 출시예정</a>
          </div>
          <p className="micro muted">다운로드/개인정보처리방침/이용약관 링크를 연결하세요.</p>
        </div>
        <div className="card dl-why">
          <h3>왜 이 앱인가요?</h3>
          <ul className="bullets">
            <li>가벼운 용량과 빠른 속도</li>
            <li>정확한 위치 데이터와 검증된 정보</li>
            <li>광고 최소화로 깔끔한 사용성</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
