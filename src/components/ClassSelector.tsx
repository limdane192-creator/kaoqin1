/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Calendar, ChevronDown, Check, FolderPlus, Layers, SlidersHorizontal, Trash2 } from 'lucide-react';
import { ClassRoom, Student, Assignment, Semester } from '../types';

interface ClassSelectorProps {
  semesters: Semester[];
  selectedSemesterId: string;
  onSelectSemester: (id: string) => void;
  onAddSemester: (name: string) => void;
  onDeleteSemester?: (id: string) => void;
  classes: ClassRoom[]; // 当前学期下的班级
  allClasses: ClassRoom[]; // 所有班级，用于统计各学期班级数
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onOpenNewClass: () => void;
  onOpenEditClass?: () => void;
  students: Student[];
  assignments?: Assignment[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectStudentModal: (student: Student) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  semesters,
  selectedSemesterId,
  onSelectSemester,
  onAddSemester,
  onDeleteSemester,
  classes,
  allClasses,
  selectedClassId,
  onSelectClass,
  onOpenNewClass,
  onOpenEditClass,
  students,
  searchQuery,
  setSearchQuery,
  onSelectStudentModal
}) => {
  const [isSemesterMenuOpen, setIsSemesterMenuOpen] = useState(false);
  const [isAddingSemester, setIsAddingSemester] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentSemester = semesters.find(s => s.id === selectedSemesterId) || semesters[0] || {
    id: 'sem_48',
    name: '48学期'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsSemesterMenuOpen(false);
        setIsAddingSemester(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSemester = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemesterName.trim()) return;
    onAddSemester(newSemesterName.trim());
    setNewSemesterName('');
    setIsAddingSemester(false);
    setIsSemesterMenuOpen(false);
  };

  const filteredStudents = searchQuery.trim()
    ? students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(s.no) === searchQuery.trim()
      )
    : [];

  const currentSemesterStudentsCount = students.filter(s => 
    classes.some(c => c.id === s.classId)
  ).length;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Top Bar: Semester Switcher & Global Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Semester Dropdown Switcher */}
            <div className="relative" ref={menuRef}>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  当前学期:
                </span>
                <button
                  type="button"
                  onClick={() => setIsSemesterMenuOpen(!isSemesterMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentSemester.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSemesterMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 当前学期的直接删除按钮 */}
                {onDeleteSemester && (
                  <button
                    type="button"
                    onClick={() => setSemesterToDelete(currentSemester)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
                    title={`删除当前学期【${currentSemester.name}】`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Semester Dropdown Menu */}
              {isSemesterMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    切换教学学期 (按学期隔离班级)
                  </div>

                  <div className="space-y-0.5 my-1 max-h-52 overflow-y-auto custom-scrollbar">
                    {semesters.map(sem => {
                      const isSelected = sem.id === selectedSemesterId;
                      const classCount = allClasses.filter(c => c.semesterId === sem.id).length;
                      return (
                        <div
                          key={sem.id}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSemester(sem.id);
                              setIsSemesterMenuOpen(false);
                              setIsAddingSemester(false);
                            }}
                            className="flex-1 flex items-center gap-2 cursor-pointer truncate text-left"
                            title={`切换至【${sem.name}】`}
                          >
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                            )}
                            <span className="truncate">{sem.name}</span>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {classCount}个班
                            </span>
                            {onDeleteSemester && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSemesterToDelete(sem);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 rounded transition-colors cursor-pointer"
                                title={`删除【${sem.name}】学期`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                    {!isAddingSemester ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingSemester(true)}
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50/70 rounded-lg font-medium transition-colors cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>手动增加新学期...</span>
                      </button>
                    ) : (
                      <form onSubmit={handleCreateSemester} className="p-1 space-y-1.5">
                        <div className="text-[11px] text-slate-600 font-medium">新增学期 (如 50学期):</div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            placeholder="如: 50学期"
                            value={newSemesterName}
                            onChange={e => setNewSemesterName(e.target.value)}
                            className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={!newSemesterName.trim()}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            确定
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-300 hidden sm:inline">|</span>

            {/* Quick summary of the selected semester */}
            <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
              <span>{classes.length} 个教学班级</span>
              <span className="text-slate-300">·</span>
              <span>{currentSemesterStudentsCount} 名在册学生</span>
              {classes.length >= 8 && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  带班 ≥8 班模版已启用
                </span>
              )}
            </div>
          </div>

          {/* Global Student Search across classes */}
          <div className="relative shrink-0 w-full md:w-60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索任意班级学生姓名..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredStudents.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    未找到学生
                  </div>
                ) : (
                  filteredStudents.map(stu => {
                    const stuClass = allClasses.find(c => c.id === stu.classId);
                    return (
                      <button
                        key={stu.id}
                        onClick={() => {
                          if (stuClass && stuClass.semesterId !== selectedSemesterId) {
                            onSelectSemester(stuClass.semesterId);
                          }
                          onSelectClass(stu.classId);
                          onSelectStudentModal(stu);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 cursor-pointer"
                      >
                        <div>
                          <span className="font-medium text-slate-800">{stu.name}</span>
                          <span className="text-slate-400 ml-1.5 font-mono">#{stu.no}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {stuClass?.semester && (
                            <span className="text-[10px] text-slate-400">
                              {stuClass.semester}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {stuClass?.name || '未知班级'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Class Tabs filtered by current semester */}
        <div className="pt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
          {classes.length === 0 ? (
            <div className="flex items-center gap-2 py-1 text-xs text-slate-500">
              <span>该学期暂无班级，点击右侧添加：</span>
            </div>
          ) : (
            classes.map(c => {
              const isSelected = c.id === selectedClassId;
              const count = students.filter(s => s.classId === c.id).length;

              return (
                <button
                  key={c.id}
                  onClick={() => onSelectClass(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-[11px] font-mono tabular-nums opacity-75">
                    {count}
                  </span>
                </button>
              );
            })
          )}

          <button
            onClick={onOpenNewClass}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100 rounded-md transition-colors shrink-0 cursor-pointer border border-blue-200 ml-1 shadow-2xs"
            title={`在 ${currentSemester.name} 中新建班级`}
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>加班</span>
          </button>

          {classes.length > 0 && onOpenEditClass && (
            <button
              onClick={onOpenEditClass}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md transition-colors shrink-0 cursor-pointer border border-slate-300 ml-1 shadow-2xs"
              title="修改当前班级的归属学期、名称、课程代码、排期与课时数"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>改班/修改归属学期</span>
            </button>
          )}
        </div>
      </div>

      {/* 确定删除学期提问弹窗 */}
      {semesterToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-rose-50 text-rose-600 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-900">
                  删除学期确认
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  目标学期：<span className="font-bold text-slate-800">{semesterToDelete.name}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 leading-relaxed font-medium">
              <div className="font-bold text-sm text-rose-950 mb-1">
                确定要删除学期【{semesterToDelete.name}】吗？
              </div>
              {allClasses.filter(c => c.semesterId === semesterToDelete.id).length > 0 ? (
                <div>
                  该学期下包含 <strong>{allClasses.filter(c => c.semesterId === semesterToDelete.id).length}</strong> 个班级。删除该学期将一并删除对应班级、学生考勤与作业记录。
                </div>
              ) : (
                <div>
                  该学期为空学期（未包含任何班级）。删除后将从学期切换列表中彻底移除。
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSemesterToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSemester) {
                    onDeleteSemester(semesterToDelete.id);
                  }
                  setSemesterToDelete(null);
                  setIsSemesterMenuOpen(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
