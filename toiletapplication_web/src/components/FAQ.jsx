import React from "react";

export default function FAQ({ items }) {
  return (
    <section id="faq" className="section alt">
      <div className="container narrow">
        <h2>자주 묻는 질문</h2>
        <div className="faqs">
          {items.map((f, i) => (
            <details key={i} className="faq">
              <summary><span>{f.q}</span><span className="expander">＋</span></summary>
              <p className="muted small">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
