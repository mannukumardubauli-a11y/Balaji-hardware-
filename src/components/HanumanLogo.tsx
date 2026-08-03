import React, { useState } from 'react';

interface HanumanLogoProps {
  className?: string;
  size?: number;
  logoUrl?: string;
}

export const HanumanLogo: React.FC<HanumanLogoProps> = ({ 
  className = '', 
  size = 40,
  logoUrl = "./pwa-icon.png"
}) => {
  const [imageError, setImageError] = useState(false);

  const effectiveUrl = logoUrl || "./pwa-icon.png";

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-xl bg-black border border-[#FF6B00]/60 overflow-hidden shadow-none shrink-0 transition-transform hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      {!imageError && effectiveUrl ? (
        <img
          src={effectiveUrl}
          alt="Sri Balaji Hardware Logo"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-xl"
        />
      ) : (
        <svg
          viewBox="0 0 200 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain p-0.5"
        >
          {/* Dark Background */}
          <rect width="200" height="220" fill="#0A0A0A" rx="20" />

          {/* Orange Silhouette - Lord Hanuman Face Artwork */}
          <g fill="#FF6B00">
            {/* U-shaped Tilak on Forehead */}
            <path d="M 92 32 C 92 20 108 20 108 32 L 108 72 C 108 84 92 84 92 72 Z" />
            <path d="M 96 35 L 104 35 L 104 68 L 96 68 Z" fill="#0A0A0A" />
            <circle cx="100" cy="78" r="4" fill="#FF6B00" />

            {/* Brow Line & Expression */}
            <path d="M 60 70 C 80 62 90 70 95 76 C 88 78 72 74 60 70 Z" />
            <path d="M 140 70 C 120 62 110 70 105 76 C 112 78 128 74 140 70 Z" />

            {/* Piercing Eye */}
            <path d="M 108 82 C 118 78 132 82 138 88 C 128 94 115 92 108 82 Z" />
            <circle cx="122" cy="86" r="3" fill="#0A0A0A" />

            {/* Nose Bridge and Muzzle */}
            <path d="M 95 78 C 96 90 92 105 85 118 C 95 116 110 114 118 108 C 108 100 100 90 95 78 Z" />

            {/* Powerful Jaw & Mouth Contour */}
            <path d="M 70 115 C 80 120 100 125 115 120 C 110 128 90 135 75 130 C 68 125 65 120 70 115 Z" />

            {/* Ear with Kundal */}
            <path d="M 142 90 C 155 92 160 108 152 118 C 145 115 142 102 142 90 Z" />
            <path d="M 152 112 C 162 116 162 132 150 134 C 144 128 146 118 152 112 Z" fill="none" stroke="#FF6B00" strokeWidth="4" />

            {/* Flowing Mane */}
            <path d="M 135 50 C 155 45 175 60 180 80 C 170 78 160 70 148 68 C 158 80 170 95 185 110 C 172 108 160 100 152 92 Z" />
            <path d="M 155 120 C 170 130 185 150 175 170 C 168 155 160 140 148 132 Z" />

            {/* Muscular Neck */}
            <path d="M 75 135 C 85 155 100 180 125 200 C 105 195 85 175 65 150 C 60 140 68 135 75 135 Z" />
            <path d="M 115 138 C 130 155 150 178 165 195 C 150 188 135 170 122 152 Z" />
          </g>
        </svg>
      )}
    </div>
  );
};
