/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertCircle, Building2, Calendar, Clock, BookOpen, UserPlus } from 'lucide-react';
import { ClassRoom, Semester } from '../types';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  semesters: Semester[];
  onUpdateClass: (classId: string, updates: Partial<ClassRoom>, newStudentNames?: string[]) => void;
  onDeleteClass?: (classId: string) => void;
  studentCount: number;
}

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  semesters,
  onUpdateClass,
  onDeleteClass,
  studentCount
}) => {
  const [selectedSemesterId, setSelectedSemesterId] = useState(currentClass.semesterId);
  const [name, setName] = useState(currentClass.name);
  const [code, setCode] = useState(currentClass.code);
  const [schedule, setSchedule] = useState(currentClass.schedule);
  const [room, setRoom] = useState(currentClass.room);
  const [totalSessions, setTotalSessions] = useState(currentClass.totalSessions);
  const [appendStudentNamesText, setAppendStudentNamesText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setSelectedSemesterId(currentClass.semesterId);
    setName(currentClass.name);
    setCode(currentClass.code);
    setSchedule(currentClass.schedule);
    setRoom(currentClass.room);
    setTotalSessions(currentClass.totalSessions);
    setAppendStudentNamesText('');
    setConfirmDelete(false);
  }, [currentClass, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sem = semesters.find(s => s.id === selectedSemesterId) || semesters[0];
    const updates: Partial<ClassRoom> = {
      semesterId: selectedSemesterId,
      semester: sem?.name || '48学期',
      name: name.trim(),
      code: code.trim() || currentClass.code,
      schedule: schedule.trim() || currentClass.schedule,
      room: room.trim() || currentClass.room,
      totalSessions: Number(totalSessions) || 30
    };

    const newNames = appendStudentNamesText
      .split(/[\n,，]+/)
      .map(n => n.trim())
      .filter(Boolean);

    onUpdateClass(currentClass.id, updates, newNames.length > 0 ? newNames : undefined);
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (onDeleteClass) {
      onDeleteClass(currentClass.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>编辑班级信息与归属学期</span>
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                当前: {currentClass.name}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              可随时修改班级归属学期、课时数、排期安排及追加学生
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-3.5 text-xs custom-scrollbar">
          {/* Semester Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>班级归属学期 *</span>
            </label>
            <select
              value={selectedSemesterId}
              onChange={e => setSelectedSemesterId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
            >
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.id === currentClass.semesterId ? '(当前所属)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              若修改学期（例如从 48学期 改为 49学期），该班级及所有名下学生、考勤成绩将自动归档至新学期。
            </p>
          </div>

          {/* Class Name & Course Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>班级名称 *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如: MW12-1 或 周六强化班"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                课程代码
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="例如: CHN-103"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Schedule & Sessions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>上课时间安排</span>
              </label>
              <input
                type="text"
                value={schedule}
                onChange={e => setSchedule(e.target.value)}
                placeholder="例如: 周一/周三 14:00 - 15:30"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                计划课时总数
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={totalSessions}
                onChange={e => setTotalSessions(Number(e.target.value))}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Classroom */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>授课教室 / 地点</span>
            </label>
            <input
              type="text"
              value={room}
              onChange={e => setRoom(e.target.value)}
              placeholder="例如: 文心楼 B-101"
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Append Students in bulk */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                <span>批量追加/补录学生姓名 (可选)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                当前已有 {studentCount} 名学生
              </span>
            </div>
            <textarea
              rows={3}
              value={appendStudentNamesText}
              onChange={e => setAppendStudentNamesText(e.target.value)}
              placeholder="有新报名的学生可在此直接粘贴姓名，每行一个（自动顺延学号）：&#10;李华&#10;张美兰"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              新增学生自动加入本班花名册，前期考勤自动视为未报名插班（不扣分）。
            </p>
          </div>

          {/* Danger zone: Delete class */}
          {onDeleteClass && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                <div className="text-rose-800 text-[11px]">
                  <span className="font-semibold">删除班级：</span>
                  {studentCount > 0 ? (
                    <span>该班级包含 {studentCount} 名在册学生，删除将连同学生档案一并清理。</span>
                  ) : (
                    <span>当前为空班级，可安全删除。</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer shrink-0 ml-2 ${
                    confirmDelete
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'text-rose-600 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  {confirmDelete ? '确认彻底删除' : '删除班级'}
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
