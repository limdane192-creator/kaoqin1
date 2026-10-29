/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  Filter
} from 'lucide-react';
import { ClassRoom, Student, TeacherJournalEntry, JournalCategory } from '../types';

interface TeacherJournalViewProps {
  classes: ClassRoom[];
  students: Student[];
  currentClass: ClassRoom;
  journalEntries: TeacherJournalEntry[];
  onAddJournalEntry: (entry: Omit<TeacherJournalEntry, 'id' | 'createdAt'>) => void;
  onUpdateJournalEntry: (id: string, updates: Partial<TeacherJournalEntry>) => void;
  onDeleteJournalEntry: (id: string) => void;
}

export const TeacherJournalView: React.FC<TeacherJournalViewProps> = ({
  classes,
  students,
  currentClass,
  journalEntries,
  onAddJournalEntry,
  onUpdateJournalEntry,
  onDeleteJournalEntry
}) => {
  const [selectedCategory, setSelectedCategory] = useState<JournalCategory | 'all'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<JournalCategory>('reflection');
  const [formClassId, setFormClassId] = useState<string>(currentClass.id);
  const [formContent, setFormContent] = useState<string>('');
  const [formStudentNames, setFormStudentNames] = useState<string>('');
  const [formActionPlan, setFormActionPlan] = useState<string>('');

  const categoryConfigs: Record<
    JournalCategory,
    { label: string; badge: string; icon: React.ReactNode; desc: string }
  > = {
    reflection: {
      label: '教学反思·误导检视',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
      desc: '反思自己教学中讲解缺少、讲得过快或误导学生的知识点'
    },
    student: {
      label: '学情关注·学习困难',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Lightbulb className="w-3.5 h-3.5 text-amber-500" />,
      desc: '记录今天哪个学生注意力不集中、发音不好、跟不上等情况'
    },
    curriculum: {
      label: '备课进度·教案微调',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <BookOpen className="w-3.5 h-3.5 text-blue-500" />,
      desc: '记录课时进度调整、练习设计及补充材料'
    },
    highlight: {
      label: '教学亮点·课堂心得',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500" />,
      desc: '记录今天特别成功的互动或学生显著进步'
    },
    general: {
      label: '日常随笔·工作备忘',
      badge: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: <Calendar className="w-3.5 h-3.5 text-slate-500" />,
      desc: '其他常规教学工作偶记'
    }
  };

  const handleOpenNewModal = () => {
    setEditingEntryId(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTitle('');
    setFormCategory('reflection');
    setFormClassId(currentClass.id);
    setFormContent('');
    setFormStudentNames('');
    setFormActionPlan('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: TeacherJournalEntry) => {
    setEditingEntryId(entry.id);
    setFormDate(entry.date);
    setFormTitle(entry.title);
    setFormCategory(entry.category);
    setFormClassId(entry.classId || '');
    setFormContent(entry.content);
    setFormStudentNames((entry.studentNames || []).join('、'));
    setFormActionPlan(entry.actionPlan || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    const studentArr = formStudentNames
      .split(/[,，、\s]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (editingEntryId) {
      onUpdateJournalEntry(editingEntryId, {
        date: formDate,
        title: formTitle.trim() || '随堂教学记录',
        category: formCategory,
        classId: formClassId || undefined,
        content: formContent.trim(),
        studentNames: studentArr,
        actionPlan: formActionPlan.trim() || undefined
      });
    } else {
      onAddJournalEntry({
        date: formDate,
        title: formTitle.trim() || '随堂教学记录',
        category: formCategory,
        classId: formClassId || undefined,
        content: formContent.trim(),
        studentNames: studentArr,
        actionPlan: formActionPlan.trim() || undefined
      });
    }

    setIsModalOpen(false);
  };

  // Filtered List
  const filteredEntries = journalEntries.filter(entry => {
    if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
      return false;
    }
    if (selectedClassFilter !== 'all') {
      if (selectedClassFilter === 'global' && entry.classId) return false;
      if (selectedClassFilter !== 'global' && entry.classId !== selectedClassFilter) return false;
    }
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchContent = entry.content.toLowerCase().includes(q);
      const matchStudents = (entry.studentNames || []).some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchStudents) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                教师工作手记与教学反思
              </h2>
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                共 {journalEntries.length} 篇工作手记
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              偶尔随手记一记：今天哪个学生学习吃力、发音没掌握好，以及自己教学缺少、讲得过急或误导学生的反思。
            </p>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>记一条手记</span>
          </button>
        </div>

        {/* Filters Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              全部类型
            </button>
            {(Object.keys(categoryConfigs) as JournalCategory[]).map(cat => {
              const cfg = categoryConfigs[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {cfg.icon}
                  <span>{cfg.label.split('·')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Class Filter & Search */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 cursor-pointer"
            >
              <option value="all">所有关联班级</option>
              <option value="global">教学通用随记</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="搜索学生或反思内容..."
                className="w-40 sm:w-52 pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Journal Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">暂无匹配的工作记录</h3>
          <p className="text-xs text-slate-400 mb-3">
            点击“记一条手记”，随时随手记下今天的教学得失与对个别学生的辅导观察。
          </p>
          <button
            onClick={handleOpenNewModal}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
          >
            新建记录
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredEntries.map(entry => {
            const cfg = categoryConfigs[entry.category] || categoryConfigs.general;
            const relatedClass = classes.find(c => c.id === entry.classId);

            return (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs text-slate-400">
                        {entry.date}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium border ${cfg.badge}`}
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>
                      {relatedClass ? (
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {relatedClass.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          教学通用
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 text-slate-400 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(entry)}
                        className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                        title="编辑此条手记"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteJournalEntry(entry.id)}
                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="删除手记"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-slate-900 mb-1.5">
                    {entry.title}
                  </h3>

                  {/* Involved Students */}
                  {entry.studentNames && entry.studentNames.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      <span className="text-[11px] text-slate-400">关注学生:</span>
                      {entry.studentNames.map((name, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Body Content */}
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>

                {/* Action Plan / Next Step Box */}
                {entry.actionPlan && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-slate-800 text-[11px] mb-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>下一步改进措施：</span>
                    </div>
                    <div className="text-slate-600 leading-normal">
                      {entry.actionPlan}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingEntryId ? '编辑工作记录' : '新增工作随记 / 教学反思'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 mt-3 text-xs">
              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    手记类别
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as JournalCategory)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {(Object.keys(categoryConfigs) as JournalCategory[]).map(cat => (
                      <option key={cat} value={cat}>
                        {categoryConfigs[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    记录日期
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Class association & Students */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    关联班级 (可选)
                  </label>
                  <select
                    value={formClassId}
                    onChange={e => setFormClassId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="">教学通用 (不限单班)</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    关注学生姓名 (顿号或空格隔开)
                  </label>
                  <input
                    type="text"
                    value={formStudentNames}
                    onChange={e => setFormStudentNames(e.target.value)}
                    placeholder="例如：苏妮莎、李胜利"
                    className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  手记标题
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="例如：第三课“把字句”讲授反思 / 苏妮莎拼音发音个别指导..."
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  内容记录 <span className="text-slate-400 font-normal">（详细记录学情、哪些学生没学好、教学有哪些疏漏或误导）</span>
                </label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="例如：今天讲第二课语法点时，例句给得太快，有几位学生跟不上。批改作业发现几处共同误区，说明我的引导存在盲区..."
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
              </div>

              {/* Action Plan */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  下一步改进措施 / 课后跟进 <span className="text-slate-400 font-normal">(可选)</span>
                </label>
                <textarea
                  rows={2}
                  value={formActionPlan}
                  onChange={e => setFormActionPlan(e.target.value)}
                  placeholder="例如：下节课开讲前用5分钟做针对性例句辨析板书；找苏妮莎单独面批生词..."
                  className="w-full p-2.5 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  {editingEntryId ? '保存手记' : '保存手记'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
