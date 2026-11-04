/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Student } from '../types';

export interface AvatarPreset {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  badge: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'panda', name: '学霸小熊猫', emoji: '🐼', bg: 'bg-emerald-100/80 text-emerald-800 border-emerald-300', badge: '认真踏实' },
  { id: 'cat', name: '元气小橘猫', emoji: '🐱', bg: 'bg-amber-100/80 text-amber-800 border-amber-300', badge: '活跃聪明' },
  { id: 'bunny', name: '萌萌小白兔', emoji: '🐰', bg: 'bg-rose-100/80 text-rose-800 border-rose-300', badge: '作业全交' },
  { id: 'bear', name: '稳重小棕熊', emoji: '🐻', bg: 'bg-yellow-100/80 text-yellow-800 border-yellow-300', badge: '守纪全勤' },
  { id: 'fox', name: '灵动小赤狐', emoji: '🦊', bg: 'bg-orange-100/80 text-orange-800 border-orange-300', badge: '思维敏捷' },
  { id: 'koala', name: '慢调小考拉', emoji: '🐨', bg: 'bg-slate-100/80 text-slate-800 border-slate-300', badge: '耐心细致' },
  { id: 'lion', name: '自信小金狮', emoji: '🦁', bg: 'bg-amber-200/70 text-amber-900 border-amber-400', badge: '口语表达' },
  { id: 'penguin', name: '礼貌小企鹅', emoji: '🐧', bg: 'bg-sky-100/80 text-sky-800 border-sky-300', badge: '尊敬师长' },
  { id: 'puppy', name: '勤劳小柴犬', emoji: '🐶', bg: 'bg-amber-100/80 text-amber-900 border-amber-300', badge: '积极发言' },
  { id: 'hamster', name: '聪明小仓鼠', emoji: '🐹', bg: 'bg-orange-100/70 text-orange-800 border-orange-300', badge: '字迹工整' },
  { id: 'tiger', name: '勇敢小萌虎', emoji: '🐯', bg: 'bg-yellow-200/70 text-yellow-900 border-yellow-400', badge: '进步之星' },
  { id: 'owl', name: '博学小猫头鹰', emoji: '🦉', bg: 'bg-indigo-100/80 text-indigo-800 border-indigo-300', badge: '学霸潜质' },
  { id: 'duck', name: '可爱小黄鸭', emoji: '🐥', bg: 'bg-lime-100/80 text-lime-800 border-lime-300', badge: '活泼开朗' },
  { id: 'frog', name: '快乐小青蛙', emoji: '🐸', bg: 'bg-emerald-100/70 text-emerald-900 border-emerald-300', badge: '善于提问' },
  { id: 'deer', name: '灵秀梅花鹿', emoji: '🦌', bg: 'bg-amber-100/60 text-amber-800 border-amber-300', badge: '文雅温和' },
  { id: 'elephant', name: '和善小飞象', emoji: '🐘', bg: 'bg-cyan-100/80 text-cyan-800 border-cyan-300', badge: '热心互助' }
];

/**
 * 根据学生信息自动派生预设卡通头像 (当学生尚未手动选择时保证每个人都有独特的萌萌头像)
 */
export function getAutoAvatarId(student: { id: string; no?: number; name: string }): string {
  if (!student) return AVATAR_PRESETS[0].id;
  let hash = 0;
  const str = student.id + (student.name || '') + (student.no || 0);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PRESETS.length;
  return AVATAR_PRESETS[index].id;
}

/**
 * 渲染学生头像组件：支持自定义图片上传 (Base64) 或萌系预设卡通头像
 */
export const StudentAvatarBadge: React.FC<{
  student: Student;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showChangeHint?: boolean;
  title?: string;
}> = ({ student, size = 'md', className = '', onClick, showChangeHint = false, title }) => {
  const isCustomPhoto = student.avatar && student.avatar.startsWith('data:image/');
  const currentPresetId = (!student.avatar || isCustomPhoto) ? getAutoAvatarId(student) : student.avatar;
  const preset = AVATAR_PRESETS.find(p => p.id === currentPresetId) || AVATAR_PRESETS[0];

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-12 h-12 text-2xl',
    xl: 'w-16 h-16 text-3xl'
  };

  const content = isCustomPhoto ? (
    <img
      src={student.avatar}
      alt={student.name}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-2xs ${className}`}
    />
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-normal border shadow-2xs select-none transition-transform ${preset.bg} ${className}`}
      title={`${student.name} 的专属卡通头像: ${preset.name} (${preset.badge})`}
    >
      <span>{preset.emoji}</span>
    </div>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group/avatar cursor-pointer focus:outline-none shrink-0"
      title="点击更换此学生的卡通头像或上传照片"
    >
      {content}
      {showChangeHint && (
        <span className="absolute -bottom-1 -right-1 bg-white text-[9px] px-1 rounded-full shadow-2xs border border-slate-200 text-slate-500 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
          改
        </span>
      )}
    </button>
  );
};
