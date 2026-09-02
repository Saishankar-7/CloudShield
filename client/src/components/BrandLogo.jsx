import React from 'react';

const BrandLogo = ({ size = 28, className = '', glow = true }) => {
  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: glow ? 'drop-shadow(0 2px 6px rgba(79, 70, 229, 0.4))' : 'none',
          transition: 'transform 0.2s ease',
        }}
      >
        <defs>
          <linearGradient id="brandShieldGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="brandGlowGrad" x1="16" y1="12" x2="48" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Shield Base */}
        <path
          d="M32 4L10 14V30C10 44.5 19.5 54.8 32 60C44.5 54.8 54 44.5 54 30V14L32 4Z"
          fill="url(#brandShieldGrad)"
        />

        {/* Inner Gloss / Depth Highlight */}
        <path
          d="M32 7L13 15.5V30C13 42.5 21.2 51.5 32 56V7Z"
          fill="url(#brandGlowGrad)"
        />

        {/* Centered Keyhole / Shield Core */}
        <g transform="translate(20, 20)">
          <path
            d="M6 11V7C6 3.686 8.686 1 12 1C15.314 1 18 3.686 18 7V11"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="3" y="10" width="18" height="13" rx="3" fill="#ffffff" />
          <circle cx="12" cy="15" r="2" fill="#312e81" />
          <path d="M11 15.5H13V19H11V15.5Z" fill="#312e81" />
        </g>
      </svg>
    </div>
  );
};

export default BrandLogo;
