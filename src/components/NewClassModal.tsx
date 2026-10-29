/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ClassRoom, Semester } from '../types';
import { defaultSessionDates, defaultSessionModes } from '../data/initialData';

interface NewClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClass: (newClass: ClassRoom, initialStudentNames: string[]) => void;
  semesters: Semester[];
  currentSemesterId: string;
}

export const NewClassModal: React.FC<NewClassModalProps> = ({
  isOpen,
  onClose,
  onCreateClass,
  semesters,
  currentSemesterId
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [schedule, setSchedule] = useState('周一/周三 14:00 - 15:30');
  const [room, setRoom] = useState('文心楼 B-101');
  const [totalSessions, setTotalSessions] = useState(30);
  const [studentNamesText, setStudentNamesText] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState(currentSemesterId);

  useEffect(() => {
    setSelectedSemesterId(currentSemesterId);
  }, [currentSemesterId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const classId = `c_${Date.now()}`;
    const sem = semesters.find(s => s.id === selectedSemesterId) || semesters[0];
    const newClass: ClassRoom = {
      id: classId,
      name: name.trim(),
      code: code.trim() || `CLS-${Math.floor(Math.random() * 900 + 100)}`,
      schedule: schedule.trim(),
      room: room.trim() || '主校区',
      semesterId: selectedSemesterId || 'sem_48',
      semester: sem?.name || '48学期',
      totalSessions: Number(totalSessions) || 30,
      sessionDates: defaultSessionDates,
      sessionModes: defaultSessionModes
    };

    const rawNames = studentNamesText
      .split(/[\n,，]+/)
      .map(n => n.trim())
      .filter(Boolean);

    onCreateClass(newClass, rawNames);
    onClose();
    setName('');
    setCode('');
    setStudentNamesText('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">新建/生成教学班级</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              支持生成8个以上班级模版，可一键批量导入学生名单
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
              归属学期 *
            </label>
            <select
              value={selectedSemesterId}
              onChange={e => setSelectedSemesterId(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                班级名称 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如: MW12-1 或 周六强化班"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                上课时间安排
              </label>
              <input
                type="text"
                value={schedule}
                onChange={e => setSchedule(e.target.value)}
                placeholder="例如: 周一/周三 08:00 - 09:30"
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
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              批量录入学生姓名 (可选)
            </label>
            <textarea
              rows={4}
              value={studentNamesText}
              onChange={e => setStudentNamesText(e.target.value)}
              placeholder="直接粘贴名单，每行一个姓名（如）：&#10;张三&#10;李四&#10;王五&#10;Sok Niza 苏妮莎"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              可随时在班级管理中单独添加或补录学生，系统会自动按顺序生成学号
            </p>
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
              立即创建班级
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
