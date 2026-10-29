/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, BookOpen, Calendar, Image as ImageIcon, Paperclip, FileText, Trash2, Eye } from 'lucide-react';
import { ClassRoom, Assignment, Student, AssignmentAttachment } from '../types';

interface NewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  students: Student[];
  onCreateAssignment: (assignment: Assignment) => void;
}

export const NewAssignmentModal: React.FC<NewAssignmentModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  students,
  onCreateAssignment
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueDateDefault = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [assignedDate, setAssignedDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueDateDefault);
  const [maxScore, setMaxScore] = useState(100);
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>, isImageOnly: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const isImg = file.type.startsWith('image/') || isImageOnly;
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;

        const newAttachment: AssignmentAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          dataUrl,
          type: isImg ? 'image' : 'file',
          size: formatFileSize(file.size)
        };

        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const classStudents = students.filter(s => s.classId === currentClass.id);
    const initialSubmissions: Assignment['submissions'] = {};

    classStudents.forEach(s => {
      initialSubmissions[s.id] = { status: 'missing' };
    });

    const newAssignment: Assignment = {
      id: `a_${Date.now()}`,
      classId: currentClass.id,
      title: title.trim(),
      content: content.trim(),
      assignedDate,
      dueDate,
      maxScore: Number(maxScore) || 100,
      submissions: initialSubmissions,
      attachments: attachments.length > 0 ? attachments : undefined
    };

    onCreateAssignment(newAssignment);
    onClose();
    setTitle('');
    setContent('');
    setAttachments([]);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              布置新作业 · {currentClass.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              记录今天布置什么内容，并设置收取与催交截止日期
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              作业标题 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如: 第四课：抄写生词3遍并注音"
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              布置具体内容及要求
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="例如: 完成课本第24页生词抄写，要求带声调拼音；完成同步练习册第18-19页基础练习。"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Photo & Document Attachments Section */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>作业照片与文件附件 (可选)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                可上传课件、作业题目照片或文档
              </span>
            </div>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              multiple
              onChange={e => handleFilesSelected(e, true)}
              className="hidden"
            />
            <input
              type="file"
              ref={docInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              multiple
              onChange={e => handleFilesSelected(e, false)}
              className="hidden"
            />

            {/* Upload Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg border border-blue-200 transition-colors cursor-pointer text-xs"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>添加作业照片/图片</span>
              </button>
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>添加文档/课件文件</span>
              </button>
            </div>

            {/* Attachments Preview Grid */}
            {attachments.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] text-slate-500 font-medium">
                  已附加 {attachments.length} 个附件：
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {attachments.map(att => (
                    <div
                      key={att.id}
                      className="relative group bg-white rounded-lg border border-slate-200 p-2 flex items-center gap-2 overflow-hidden shadow-2xs"
                    >
                      {att.type === 'image' ? (
                        <div
                          onClick={() => setPreviewImage(att.dataUrl)}
                          className="w-10 h-10 rounded overflow-hidden bg-slate-100 shrink-0 cursor-pointer relative"
                        >
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 shrink-0 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-slate-800 truncate" title={att.name}>
                          {att.name}
                        </div>
                        {att.size && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {att.size}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="移除附件"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                布置日期 (今天)
              </label>
              <input
                type="date"
                required
                value={assignedDate}
                onChange={e => setAssignedDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                收取截止日期
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              确认发布作业
            </button>
          </div>
        </form>
      </div>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="预览照片"
              className="max-h-[80vh] w-auto object-contain mx-auto rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};
