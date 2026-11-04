/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * 可爱戴眼镜读书熊猫 (整洁、干净、萌系极简风格)
 */
export const CutePandaStudent: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 64
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Soft Glow */}
    <circle cx="60" cy="60" r="54" fill="#F0FDF4" />
    
    {/* Panda Ears */}
    <circle cx="34" cy="30" r="14" fill="#334155" />
    <circle cx="34" cy="30" r="8" fill="#475569" />
    <circle cx="86" cy="30" r="14" fill="#334155" />
    <circle cx="86" cy="30" r="8" fill="#475569" />

    {/* Panda Face Base */}
    <ellipse cx="60" cy="62" rx="42" ry="38" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />

    {/* Cute Eye Patches */}
    <ellipse cx="44" cy="58" rx="12" ry="14" transform="rotate(-15 44 58)" fill="#334155" />
    <ellipse cx="76" cy="58" rx="12" ry="14" transform="rotate(15 76 58)" fill="#334155" />

    {/* Sparkle Eyes */}
    <circle cx="45" cy="57" r="4.5" fill="#FFFFFF" />
    <circle cx="47" cy="55" r="2" fill="#FFFFFF" />
    <circle cx="75" cy="57" r="4.5" fill="#FFFFFF" />
    <circle cx="77" cy="55" r="2" fill="#FFFFFF" />

    {/* Cute Round Glasses */}
    <circle cx="44" cy="58" r="16" fill="none" stroke="#2563EB" strokeWidth="2.5" />
    <circle cx="76" cy="58" r="16" fill="none" stroke="#2563EB" strokeWidth="2.5" />
    <path d="M60 58H60.5" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />

    {/* Rosy Cheeks */}
    <ellipse cx="32" cy="72" rx="7" ry="4" fill="#FDA4AF" opacity="0.65" />
    <ellipse cx="88" cy="72" rx="7" ry="4" fill="#FDA4AF" opacity="0.65" />

    {/* Nose and Mouth */}
    <ellipse cx="60" cy="68" rx="4.5" ry="3.5" fill="#334155" />
    <path d="M56 74Q60 78 64 74" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

    {/* Cute Little Graduation Leaf / Sprout */}
    <path d="M60 25C60 17 68 18 68 25C60 25 60 25 60 25Z" fill="#10B981" />
    <path d="M60 25C60 19 53 19 53 25C60 25 60 25 60 25Z" fill="#34D399" />
    <path d="M60 25V30" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

    {/* Little Paws holding a Book */}
    <rect x="42" y="88" width="36" height="22" rx="4" fill="#3B82F6" />
    <rect x="44" y="90" width="15" height="18" rx="2" fill="#EFF6FF" />
    <rect x="61" y="90" width="15" height="18" rx="2" fill="#EFF6FF" />
    <circle cx="38" cy="94" r="6" fill="#334155" />
    <circle cx="82" cy="94" r="6" fill="#334155" />
  </svg>
);

/**
 * 可爱作业小兔 (交齐作业、打满分、活力可爱)
 */
export const CuteHomeworkBunny: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 54
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Soft Background */}
    <circle cx="50" cy="50" r="46" fill="#FFFBEB" />

    {/* Bunny Ears */}
    <path d="M38 10C34 10 32 32 38 42C44 32 42 10 38 10Z" fill="#FFFFFF" stroke="#FDE68A" strokeWidth="2" />
    <path d="M38 15C36 15 35 28 38 34C41 28 40 15 38 15Z" fill="#FBCFE8" />
    <path d="M62 10C58 10 56 32 62 42C68 32 66 10 62 10Z" fill="#FFFFFF" stroke="#FDE68A" strokeWidth="2" />
    <path d="M62 15C60 15 59 28 62 34C65 28 64 15 62 15Z" fill="#FBCFE8" />

    {/* Bunny Head */}
    <circle cx="50" cy="56" r="32" fill="#FFFFFF" stroke="#FDE68A" strokeWidth="2" />

    {/* Eyes */}
    <circle cx="40" cy="52" r="3.5" fill="#475569" />
    <circle cx="41" cy="51" r="1.2" fill="#FFFFFF" />
    <circle cx="60" cy="52" r="3.5" fill="#475569" />
    <circle cx="61" cy="51" r="1.2" fill="#FFFFFF" />

    {/* Rosy Cheeks */}
    <circle cx="32" cy="62" r="5" fill="#FDA4AF" opacity="0.6" />
    <circle cx="68" cy="62" r="5" fill="#FDA4AF" opacity="0.6" />

    {/* Nose & Mouth */}
    <polygon points="50,60 48,58 52,58" fill="#F472B6" />
    <path d="M47 62Q50 64 53 62" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />

    {/* Mini Gold Star Badge */}
    <polygon
      points="78,28 80,33 85,34 81,38 82,43 78,40 74,43 75,38 71,34 76,33"
      fill="#F59E0B"
    />
  </svg>
);

/**
 * 可爱出勤小橘猫 (全勤出勤、阳光活泼)
 */
export const CuteAttendanceCat: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 54
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="#F0FDF4" />

    {/* Cat Ears */}
    <polygon points="26,42 34,16 48,34" fill="#FB923C" />
    <polygon points="30,38 35,22 44,34" fill="#FED7AA" />
    <polygon points="74,42 66,16 52,34" fill="#FB923C" />
    <polygon points="70,38 65,22 56,34" fill="#FED7AA" />

    {/* Cat Head */}
    <ellipse cx="50" cy="56" rx="34" ry="30" fill="#FFEDD5" stroke="#FDBA74" strokeWidth="2" />

    {/* Cute Stripes on Forehead */}
    <path d="M50 34V42" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
    <path d="M44 36L46 42" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M56 36L54 42" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />

    {/* Eyes */}
    <circle cx="39" cy="54" r="4" fill="#431407" />
    <circle cx="40" cy="52" r="1.5" fill="#FFFFFF" />
    <circle cx="61" cy="54" r="4" fill="#431407" />
    <circle cx="62" cy="52" r="1.5" fill="#FFFFFF" />

    {/* Cheeks */}
    <circle cx="31" cy="62" r="5" fill="#FCA5A5" opacity="0.65" />
    <circle cx="69" cy="62" r="5" fill="#FCA5A5" opacity="0.65" />

    {/* Nose and Mouth */}
    <polygon points="50,62 47,60 53,60" fill="#F87171" />
    <path d="M46 64Q50 67 54 64" fill="none" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" />

    {/* Whiskers */}
    <path d="M22 58H30" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M22 64H29" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M78 58H70" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M78 64H71" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * 荣誉小太阳徽章 (优秀、满分、积极鼓励)
 */
export const CuteSunBadge: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Sun Rays */}
    <circle cx="30" cy="30" r="18" fill="#FDE047" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <rect
        key={i}
        x="28.5"
        y="4"
        width="3"
        height="6"
        rx="1.5"
        fill="#F59E0B"
        transform={`rotate(${angle} 30 30)`}
      />
    ))}
    {/* Smile face */}
    <circle cx="24" cy="27" r="2" fill="#78350F" />
    <circle cx="36" cy="27" r="2" fill="#78350F" />
    <path d="M26 34Q30 38 34 34" fill="none" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
    <circle cx="20" cy="31" r="2" fill="#FB7185" opacity="0.8" />
    <circle cx="40" cy="31" r="2" fill="#FB7185" opacity="0.8" />
  </svg>
);

/**
 * 可爱催交小萌喵 (手抱小闹钟，提醒写作业、可爱软萌)
 */
export const CuteReminderKitten: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <circle cx="50" cy="50" r="46" fill="#FFF1F2" />
    
    {/* Cat Ears */}
    <polygon points="26,38 32,16 46,32" fill="#FDA4AF" />
    <polygon points="30,34 34,22 42,32" fill="#FFE4E6" />
    <polygon points="74,38 68,16 54,32" fill="#FDA4AF" />
    <polygon points="70,34 66,22 58,32" fill="#FFE4E6" />

    {/* Head */}
    <ellipse cx="50" cy="50" rx="32" ry="28" fill="#FFFFFF" stroke="#FECDD3" strokeWidth="2" />

    {/* Big Cute Eyes */}
    <circle cx="40" cy="46" r="4.5" fill="#475569" />
    <circle cx="41" cy="44" r="1.8" fill="#FFFFFF" />
    <circle cx="60" cy="46" r="4.5" fill="#475569" />
    <circle cx="61" cy="44" r="1.8" fill="#FFFFFF" />

    {/* Rosy Cheeks */}
    <ellipse cx="32" cy="54" rx="5" ry="3.5" fill="#FB7185" opacity="0.6" />
    <ellipse cx="68" cy="54" rx="5" ry="3.5" fill="#FB7185" opacity="0.6" />

    {/* Nose & Mouth */}
    <polygon points="50,52 47.5,50 52.5,50" fill="#F43F5E" />
    <path d="M47 54Q50 57 53 54" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />

    {/* Cute Pink Little Alarm Clock */}
    <g transform="translate(42, 60)">
      <circle cx="16" cy="16" r="14" fill="#FFE4E6" stroke="#F43F5E" strokeWidth="2" />
      <circle cx="16" cy="16" r="10" fill="#FFFFFF" />
      <path d="M16 10V16H20" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="4" r="3.5" fill="#FB7185" />
      <circle cx="24" cy="4" r="3.5" fill="#FB7185" />
      <rect x="10" y="27" width="2.5" height="4" rx="1" fill="#FDA4AF" transform="rotate(20 10 27)" />
      <rect x="20" y="27" width="2.5" height="4" rx="1" fill="#FDA4AF" transform="rotate(-20 20 27)" />
    </g>
  </svg>
);

/**
 * 可爱小脚印 (装饰、萌化)
 */
export const CutePawIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 18
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
  >
    <ellipse cx="12" cy="15" rx="5" ry="4" />
    <circle cx="7" cy="9" r="2.2" />
    <circle cx="11" cy="7" r="2.2" />
    <circle cx="15.5" cy="8" r="2.2" />
    <circle cx="19" cy="11.5" r="1.8" />
  </svg>
);

