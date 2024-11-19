import React from "react";
import type { FeatureSupport } from "../utils/featureDetect";
import { motion } from "framer-motion";

interface Props {
  feature: FeatureSupport;
  onClose?: () => void;
}

export const FeatureWarning: React.FC<Props> = ({ feature, onClose }) => {
  const getBrowser = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edge")) return "Edge";
    return "浏览器";
  };

  const browser = getBrowser();
  const minVersion = feature.minVersion[browser.toLowerCase()];

  return (
    <div className="warning-container">
      <div className="feature-warning">
        <div className="feature-warning-content">
          <div className="warning-icon">⚠️</div>
          <div className="warning-message">
            <h3>需要更新浏览器</h3>
            <p>
              {`${feature.name}功能需要 ${browser} ${minVersion || "最新版本"}或更高版本才能使用。`}
            </p>
            <p>请更新您的浏览器以使用此功能。</p>
          </div>
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
