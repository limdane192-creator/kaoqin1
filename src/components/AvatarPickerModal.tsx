/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { X, Upload, Sparkles, Check, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { Student } from '../types';
import { AVATAR_PRESETS, getAutoAvatarId } from '../utils/avatarHelper';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSaveAvatar: (studentId: string, avatarDataOrId: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveAvatar
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [customPhotoPreview, setCustomPhotoPreview] = useState<string | null>(null);

  // Sync initial state when modal opens
  React.useEffect(() => {
    if (student) {
      if (student.avatar && student.avatar.startsWith('data:image/')) {
        setCustomPhotoPreview(student.avatar);
        setSelectedAvatar('custom');
      } else {
        setCustomPhotoPreview(null);
        setSelectedAvatar(student.avatar || getAutoAvatarId(student));
      }
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  // Handle custom photo file upload and resize to 256x256 max
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCustomPhotoPreview(dataUrl);
          setSelectedAvatar('custom');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (selectedAvatar === 'custom' && customPhotoPreview) {
      onSaveAvatar(student.id, customPhotoPreview);
    } else if (selectedAvatar) {
      onSaveAvatar(student.id, selectedAvatar);
    }
    onClose();
  };

  const handleResetToDefault = () => {
    const autoId = getAutoAvatarId(student);
    setSelectedAvatar(autoId);
    setCustomPhotoPreview(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                为【{student.name}】选择专属卡通头像
              </h3>
              <p className="text-[11px] text-slate-500">
                可自主挑选可爱的萌宠卡通头像，也可上传真实学员免冠照片
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Preview */}
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {selectedAvatar === 'custom' && customPhotoPreview ? (
              <img
                src={customPhotoPreview}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
              />
            ) : (
              (() => {
                const p = AVATAR_PRESETS.find(item => item.id === selectedAvatar) || AVATAR_PRESETS[0];
                return (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-xs ${p.bg}`}>
                    <span>{p.emoji}</span>
                  </div>
                );
              })()
            )}
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{student.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">No.{student.no}</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {selectedAvatar === 'custom'
                  ? '已选自定义真实照片'
                  : `已选卡通头像: ${AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.name || '卡通萌宠'}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-md cursor-pointer transition-colors shadow-2xs"
            title="恢复系统智能匹配的卡通头像"
          >
            <RotateCcw className="w-3 h-3" />
            <span>恢复默认</span>
          </button>
        </div>

        {/* Presets Gallery Grid */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">
              可选卡通萌趣头像库 (16款)
            </span>
            <span className="text-[10px] text-slate-400">点击选中</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
            {AVATAR_PRESETS.map(preset => {
              const isChosen = selectedAvatar === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(preset.id);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer relative group ${
                    isChosen
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border shadow-2xs ${preset.bg}`}>
                    <span>{preset.emoji}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-700 mt-1 truncate max-w-full">
                    {preset.name.replace('小', '')}
                  </span>
                  {isChosen && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Photo Upload Area */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/80"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>上传真实相片/证件照...</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>确认保存头像</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
