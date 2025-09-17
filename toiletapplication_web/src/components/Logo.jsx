import React from "react";
export default function Logo({ small = false }) {
  return (
    <div className={small ? "logo logo-small" : "logo"} aria-label="앱 로고">
      WC
    </div>
  );
}
