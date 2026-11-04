/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  FileDown,
  Copy,
  Sparkles,
  Award,
  Upload,
  Calendar,
  Check,
  Edit3,
  Smile,
  FileText,
  Code
} from 'lucide-react';
import { Student, ClassRoom, Semester, Assignment } from '../types';
import { calculateStudentAttendance, calculateStudentHomework, computeStudentScores } from '../utils/calculations';
import { StudentAvatarBadge, AVATAR_PRESETS } from '../utils/avatarHelper';

export type CertificateTemplateId = 'gold' | 'cute' | 'navy' | 'emerald';

interface CertificateTemplateOption {
  id: CertificateTemplateId;
  name: string;
  badge: string;
  icon: string;
  outerBorder: string;
  innerBorder: string;
  bgGradient: string;
  titleColor: string;
  subtitleColor: string;
  accentColor: string;
  sealGradient: string;
  sealBorder: string;
  sealTextColor: string;
  tagColor: string;
  quoteBg: string;
  cornerClass: string;
}

const TEMPLATES: Record<CertificateTemplateId, CertificateTemplateOption> = {
  gold: {
    id: 'gold',
    name: '典雅皇家金',
    badge: '正规典雅',
    icon: '🏛️',
    outerBorder: 'border-amber-700/30',
    innerBorder: 'border-amber-600/40',
    bgGradient: 'linear-gradient(135deg, #FFFEFB 0%, #FFFDF5 50%, #FCF8EA 100%)',
    titleColor: 'text-amber-950',
    subtitleColor: 'text-amber-800',
    accentColor: 'border-amber-600 text-amber-900',
    sealGradient: 'from-amber-400 via-yellow-300 to-amber-500',
    sealBorder: 'border-amber-700/50',
    sealTextColor: 'text-amber-950',
    tagColor: 'bg-amber-100/80 text-amber-900 border-amber-300',
    quoteBg: 'bg-amber-50/70 border-amber-200/80 text-amber-950',
    cornerClass: 'border-amber-700/70'
  },
  cute: {
    id: 'cute',
    name: '萌趣乐园风',
    badge: '可爱活力',
    icon: '🌸',
    outerBorder: 'border-pink-300/60',
    innerBorder: 'border-dashed border-rose-300/80',
    bgGradient: 'linear-gradient(135deg, #FFF9FB 0%, #FFF5F7 50%, #F5F7FF 100%)',
    titleColor: 'text-rose-900',
    subtitleColor: 'text-pink-700',
    accentColor: 'border-pink-400 text-rose-900',
    sealGradient: 'from-pink-400 via-rose-300 to-amber-300',
    sealBorder: 'border-rose-400',
    sealTextColor: 'text-rose-950',
    tagColor: 'bg-rose-100/80 text-rose-800 border-rose-200',
    quoteBg: 'bg-pink-50/80 border-pink-200 text-rose-900',
    cornerClass: 'border-rose-400'
  },
  navy: {
    id: 'navy',
    name: '名校蓝金风',
    badge: '庄重学府',
    icon: '🎓',
    outerBorder: 'border-blue-900/30',
    innerBorder: 'border-blue-800/40',
    bgGradient: 'linear-gradient(135deg, #FAFCFF 0%, #F4F8FD 50%, #FAF6EE 100%)',
    titleColor: 'text-slate-900',
    subtitleColor: 'text-blue-900',
    accentColor: 'border-blue-700 text-blue-950',
    sealGradient: 'from-blue-600 via-indigo-500 to-amber-400',
    sealBorder: 'border-blue-900/40',
    sealTextColor: 'text-blue-950',
    tagColor: 'bg-blue-100/80 text-blue-900 border-blue-300',
    quoteBg: 'bg-blue-50/70 border-blue-200 text-slate-800',
    cornerClass: 'border-blue-900/70'
  },
  emerald: {
    id: 'emerald',
    name: '清新元气绿',
    badge: '生机成长',
    icon: '🌿',
    outerBorder: 'border-emerald-700/30',
    innerBorder: 'border-emerald-600/40',
    bgGradient: 'linear-gradient(135deg, #FBFFFD 0%, #F3FBF7 50%, #FFFDF7 100%)',
    titleColor: 'text-emerald-950',
    subtitleColor: 'text-teal-800',
    accentColor: 'border-emerald-600 text-emerald-950',
    sealGradient: 'from-emerald-400 via-teal-300 to-yellow-300',
    sealBorder: 'border-emerald-700/40',
    sealTextColor: 'text-emerald-950',
    tagColor: 'bg-emerald-100/80 text-emerald-900 border-emerald-300',
    quoteBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
    cornerClass: 'border-emerald-700/70'
  }
};

const TEMPLATE_HTML_STYLES: Record<
  CertificateTemplateId,
  {
    outerBorder: string;
    innerBorder: string;
    bgGradient: string;
    titleColor: string;
    subtitleColor: string;
    cornerColor: string;
    quoteBg: string;
    quoteBorder: string;
    quoteTextColor: string;
    sealGradient: string;
    sealTextColor: string;
    sealBorder: string;
    dividerColor: string;
  }
> = {
  gold: {
    outerBorder: '#b45309',
    innerBorder: '2px solid rgba(217, 119, 6, 0.45)',
    bgGradient: 'linear-gradient(135deg, #FFFEFB 0%, #FFFDF5 50%, #FCF8EA 100%)',
    titleColor: '#451a03',
    subtitleColor: '#92400e',
    cornerColor: '#b45309',
    quoteBg: 'rgba(254, 243, 199, 0.5)',
    quoteBorder: '#fde68a',
    quoteTextColor: '#78350f',
    sealGradient: 'linear-gradient(135deg, #f59e0b, #fde047, #d97706)',
    sealTextColor: '#451a03',
    sealBorder: '#d97706',
    dividerColor: '#d97706'
  },
  cute: {
    outerBorder: '#f472b6',
    innerBorder: '2px dashed rgba(251, 113, 133, 0.7)',
    bgGradient: 'linear-gradient(135deg, #FFF9FB 0%, #FFF5F7 50%, #F5F7FF 100%)',
    titleColor: '#881337',
    subtitleColor: '#be185d',
    cornerColor: '#fb7185',
    quoteBg: 'rgba(255, 241, 242, 0.7)',
    quoteBorder: '#fecdd3',
    quoteTextColor: '#881337',
    sealGradient: 'linear-gradient(135deg, #f472b6, #fb7185, #fcd34d)',
    sealTextColor: '#881337',
    sealBorder: '#fb7185',
    dividerColor: '#f472b6'
  },
  navy: {
    outerBorder: '#1e3a8a',
    innerBorder: '2px solid rgba(37, 99, 235, 0.35)',
    bgGradient: 'linear-gradient(135deg, #FAFCFF 0%, #F4F8FD 50%, #FAF6EE 100%)',
    titleColor: '#0f172a',
    subtitleColor: '#1e3a8a',
    cornerColor: '#1e3a8a',
    quoteBg: 'rgba(239, 246, 255, 0.6)',
    quoteBorder: '#bfdbfe',
    quoteTextColor: '#1e293b',
    sealGradient: 'linear-gradient(135deg, #2563eb, #6366f1, #fbbf24)',
    sealTextColor: '#0f172a',
    sealBorder: '#1e3a8a',
    dividerColor: '#1e3a8a'
  },
  emerald: {
    outerBorder: '#047857',
    innerBorder: '2px solid rgba(5, 150, 105, 0.4)',
    bgGradient: 'linear-gradient(135deg, #FBFFFD 0%, #F3FBF7 50%, #FFFDF7 100%)',
    titleColor: '#064e3b',
    subtitleColor: '#0f766e',
    cornerColor: '#047857',
    quoteBg: 'rgba(240, 253, 244, 0.6)',
    quoteBorder: '#bbf7d0',
    quoteTextColor: '#064e3b',
    sealGradient: 'linear-gradient(135deg, #10b981, #5eead4, #fde047)',
    sealTextColor: '#064e3b',
    sealBorder: '#059669',
    dividerColor: '#059669'
  }
};

interface GraduationCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  currentClass?: ClassRoom;
  semester?: Semester;
  assignments: Assignment[];
  allClassStudents?: Student[];
  onUpdateStudentAvatar?: (studentId: string, avatar: string) => void;
  onOpenAvatarPicker?: (student: Student) => void;
}

export const GraduationCertificateModal: React.FC<GraduationCertificateModalProps> = ({
  isOpen,
  onClose,
  student,
  currentClass,
  semester,
  assignments,
  allClassStudents = [],
  onUpdateStudentAvatar,
  onOpenAvatarPicker
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template State (支持手动自由切换不同证书背景设计风格：皇家金、萌趣可爱、名校蓝金、清新翡翠)
  const [selectedTemplateId, setSelectedTemplateId] = useState<CertificateTemplateId>('gold');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [batchCopied, setBatchCopied] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>('');

  // Preload logo and convert to base64 Data URL so downloaded HTML files work 100% offline
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/assets/aistudio/logo-long_aac4cdca.png';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          setLogoBase64(dataUrl);
        }
      } catch {
        setLogoBase64('/assets/aistudio/logo-long_aac4cdca.png');
      }
    };
    img.onerror = () => {
      setLogoBase64('/assets/aistudio/logo-long_aac4cdca.png');
    };
  }, []);

  // Calculate scores & performance
  const classAssignments = assignments.filter(a => a.classId === student?.classId);
  const targetAttDays = currentClass?.totalSessions || 30;
  const targetHwCount = classAssignments.length > 0 ? classAssignments.length : (currentClass?.totalHwTarget || 10);

  const attStats = student ? calculateStudentAttendance(student, targetAttDays) : null;
  const hwStats = student ? calculateStudentHomework(student.id, classAssignments) : null;
  const sc = student
    ? computeStudentScores(
        student.scores,
        targetAttDays,
        targetHwCount,
        attStats?.attendanceScore10,
        hwStats?.homeworkScore10
      )
    : null;

  const totalScore = sc?.manualTotal ?? 90;
  const gradeLevel = student?.evaluation.grade || (totalScore >= 90 ? '优秀' : totalScore >= 80 ? '良好' : '合格');

  // Semester naming resolution (【Go Chinese-GCP】这里添加学期，例如 49学期 · Go Chinese-GCP)
  const semesterDisplayName = semester?.name || currentClass?.semester || '48学期';
  const classDisplayName = currentClass?.name || 'Go Chinese-GCP';
  const courseFullName = `【${semesterDisplayName} · ${classDisplayName}】`;

  // Certificate ID & Issue Date
  const certSerial = student
    ? `CAM-${semesterDisplayName.replace(/\D/g, '') || '48'}-${student.no.toString().padStart(3, '0')}`
    : 'CAM-48-001';

  const todayDateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Default Commendation Text
  const [certificateText, setCertificateText] = useState<string>('');

  // Initialize or reset text when student changes
  useEffect(() => {
    if (student) {
      const defaultCommendation =
        student.evaluation.remarks ||
        `该生在柬埔寨-东盟国际学院中文部专修课程中，课堂出勤优异，学习态度端正，乐于交流，作业认真工整，考查表现突出，特发此证，以资鼓励！`;
      setCertificateText(defaultCommendation);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const currentTemplate = TEMPLATES[selectedTemplateId];

  // Helper to render student avatar for HTML document
  const renderAvatarHtml = (stu: Student): string => {
    if (stu.avatar && stu.avatar.startsWith('data:image')) {
      return `<img src="${stu.avatar}" alt="${stu.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    }
    const preset = AVATAR_PRESETS.find(p => p.id === stu.avatar);
    const emoji = preset ? preset.emoji : '🐯';
    return `<span style="font-size:30px;line-height:1;display:block;">${emoji}</span>`;
  };

  // Render a single certificate page inside HTML
  const renderCertPageHtml = (
    stu: Student,
    remarkText: string,
    tmpl: typeof TEMPLATE_HTML_STYLES[CertificateTemplateId],
    logoImgSrc: string
  ): string => {
    const sAttStats = calculateStudentAttendance(stu, targetAttDays);
    const sHwStats = calculateStudentHomework(stu.id, classAssignments);
    const sSc = computeStudentScores(
      stu.scores,
      targetAttDays,
      targetHwCount,
      sAttStats.attendanceScore10,
      sHwStats.homeworkScore10
    );
    const sScore = sSc.manualTotal ?? 90;
    const sGrade = stu.evaluation.grade || (sScore >= 90 ? '优秀' : sScore >= 80 ? '良好' : '合格');
    const sSerial = `CAM-${semesterDisplayName.replace(/\D/g, '') || '48'}-${stu.no.toString().padStart(3, '0')}`;

    return `
    <div class="cert-page">
      <div class="inner-border"></div>
      <div class="ornament-corner tl"></div>
      <div class="ornament-corner tr"></div>
      <div class="ornament-corner bl"></div>
      <div class="ornament-corner br"></div>

      <!-- 1. 学校抬头 -->
      <div class="cert-header">
        <img src="${logoImgSrc}" alt="CAM-ASEAN FOREIGN LANGUAGE SCHOOL" class="school-logo" />
        <div class="school-title-row">
          <span class="line-deco"></span>
          <span class="school-name-zh">柬埔寨-东盟国际学院 · 中文部</span>
          <span class="line-deco"></span>
        </div>
        <div class="school-name-en">CAM-ASEAN INTERNATIONAL INSTITUTE · CHINESE DEPARTMENT</div>
      </div>

      <!-- 2. 证书标题 -->
      <div class="cert-title-wrap">
        <div class="cert-title">结 业 证 书</div>
        <div class="cert-subtitle">CERTIFICATE OF COMPLETION</div>
        <div class="cert-divider">
          <span class="div-line"></span>
          <span class="div-diamond">◆</span>
          <span class="div-line"></span>
        </div>
      </div>

      <!-- 3. 表彰正文与学员姓名 -->
      <div class="cert-body">
        <div class="student-badge-row">
          <div class="avatar-circle">
            ${renderAvatarHtml(stu)}
          </div>
          <div class="student-info-col">
            <div class="student-name">${stu.name}</div>
            <div class="student-meta">
              学号: No.${stu.no} · 课程: <span class="course-highlight">${semesterDisplayName} · ${classDisplayName}</span>
            </div>
          </div>
        </div>

        <div class="cert-proclamation">
          兹证明 <strong class="student-highlight">${stu.name}</strong> 同学，在
          <strong class="school-highlight">柬埔寨-东盟国际学院</strong>
          <span class="course-badge">【${semesterDisplayName} · ${classDisplayName}】</span>
          专修课程学习期间，修满规定教学课时，刻苦勤奋，品行端正。经综合考核总评成绩为
          <span class="score-badge">${sScore} 分</span>
          （综合等第：<strong class="grade-badge">${sGrade}</strong>），特准予结业，颁发此证，以资表彰与鼓励！
        </div>

        <div class="teacher-quote-box">
          “${remarkText}”
        </div>
      </div>

      <!-- 4. 底部签字、印章与日期 -->
      <div class="cert-footer">
        <div class="footer-left">
          <div class="serial-no">证书编号: <strong>${sSerial}</strong></div>
          <div class="issue-date">发证日期: ${todayDateStr}</div>
          <div class="learning-mode">授课形式: 柬东国际教学大纲 · 线下教室与线上互动融合</div>
        </div>

        <div class="seal-wrap">
          <div class="seal-circle">
            <div class="seal-inner">
              <div class="seal-star">★</div>
              <div class="seal-text-top">CAM-ASEAN</div>
              <div class="seal-text-bot">柬东国际学院</div>
            </div>
          </div>
        </div>

        <div class="footer-right">
          <div class="teacher-sign-name">林达妮 老师</div>
          <div class="teacher-title">任课教师 / CERTIFIED TEACHER</div>
          <div class="informal-notice">※ 非正式证书 · 仅供学习成长与阶段激励使用</div>
        </div>
      </div>
    </div>`;
  };

  // Generate complete, self-contained standalone HTML document
  const generateCompleteHtmlDocument = (
    pagesContent: string,
    docTitle: string,
    tmpl: typeof TEMPLATE_HTML_STYLES[CertificateTemplateId]
  ): string => {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #f1f5f9;
      font-family: 'Songti SC', 'SimSun', 'STSong', 'Noto Serif SC', 'Georgia', serif;
      color: #1e293b;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 10px;
      -webkit-font-smoothing: antialiased;
    }
    .no-print-toolbar {
      width: 100%;
      max-width: 980px;
      margin-bottom: 20px;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.06);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
    }
    .toolbar-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .toolbar-hint {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(37,99,235,0.25);
      transition: background 0.15s;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }
    .cert-page {
      width: 100%;
      max-width: 980px;
      aspect-ratio: 1.414 / 1;
      background: ${tmpl.bgGradient};
      border: 8px solid ${tmpl.outerBorder};
      border-radius: 16px;
      padding: 28px 40px;
      position: relative;
      box-shadow: 0 12px 30px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin-bottom: 28px;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }
    .inner-border {
      position: absolute;
      inset: 8px;
      border: ${tmpl.innerBorder};
      border-radius: 10px;
      pointer-events: none;
    }
    .ornament-corner {
      position: absolute;
      width: 26px;
      height: 26px;
      pointer-events: none;
    }
    .tl { top: 14px; left: 14px; border-top: 2px solid ${tmpl.cornerColor}; border-left: 2px solid ${tmpl.cornerColor}; }
    .tr { top: 14px; right: 14px; border-top: 2px solid ${tmpl.cornerColor}; border-right: 2px solid ${tmpl.cornerColor}; }
    .bl { bottom: 14px; left: 14px; border-bottom: 2px solid ${tmpl.cornerColor}; border-left: 2px solid ${tmpl.cornerColor}; }
    .br { bottom: 14px; right: 14px; border-bottom: 2px solid ${tmpl.cornerColor}; border-right: 2px solid ${tmpl.cornerColor}; }

    .cert-header {
      text-align: center;
    }
    .school-logo {
      height: 48px;
      max-width: 80%;
      object-fit: contain;
      display: block;
      margin: 0 auto 5px;
    }
    .school-title-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .line-deco {
      height: 1px;
      width: 48px;
      background: #cbd5e1;
    }
    .school-name-zh {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #0f172a;
    }
    .school-name-en {
      font-size: 9px;
      font-family: monospace;
      letter-spacing: 2px;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
    }

    .cert-title-wrap {
      text-align: center;
      margin: 6px 0;
    }
    .cert-title {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 12px;
      color: ${tmpl.titleColor};
      margin-bottom: 2px;
      text-indent: 12px;
    }
    .cert-subtitle {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 4px;
      color: ${tmpl.subtitleColor};
      text-transform: uppercase;
    }
    .cert-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 4px;
    }
    .div-line {
      height: 1px;
      width: 50px;
      background: ${tmpl.dividerColor};
      opacity: 0.5;
    }
    .div-diamond {
      color: ${tmpl.dividerColor};
      font-size: 10px;
    }

    .cert-body {
      padding: 0 16px;
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
    }
    .student-badge-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
    }
    .avatar-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #fef3c7;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .student-info-col {
      text-align: left;
    }
    .student-name {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 1px;
    }
    .student-meta {
      font-size: 12px;
      color: #64748b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin-top: 2px;
    }
    .course-highlight {
      color: #1e3a8a;
      font-weight: 700;
    }

    .cert-proclamation {
      font-size: 14px;
      line-height: 1.85;
      color: #334155;
      max-width: 760px;
      margin: 0 auto;
    }
    .student-highlight {
      font-size: 16px;
      color: #0f172a;
      border-bottom: 1px solid #94a3b8;
      padding: 0 4px;
    }
    .school-highlight {
      color: #0f172a;
      padding: 0 2px;
    }
    .course-badge {
      background: rgba(239, 246, 255, 0.9);
      border: 1px solid #bfdbfe;
      color: #1e3a8a;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .score-badge {
      background: #fef3c7;
      border: 1px solid #fde68a;
      color: #78350f;
      font-family: monospace;
      font-weight: 800;
      font-size: 15px;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .grade-badge {
      color: #065f46;
    }

    .teacher-quote-box {
      max-width: 650px;
      margin: 0 auto;
      padding: 8px 16px;
      background: ${tmpl.quoteBg};
      border: 1px solid ${tmpl.quoteBorder};
      color: ${tmpl.quoteTextColor};
      border-radius: 8px;
      font-size: 12px;
      font-style: italic;
      line-height: 1.6;
      text-align: center;
    }

    .cert-footer {
      border-top: 1px solid rgba(148, 163, 184, 0.4);
      padding-top: 10px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      font-size: 12px;
    }
    .footer-left {
      text-align: left;
      font-size: 11px;
    }
    .serial-no {
      font-family: monospace;
      color: #64748b;
    }
    .issue-date {
      color: #475569;
      margin: 2px 0;
    }
    .learning-mode {
      font-size: 10px;
      color: #94a3b8;
    }

    .seal-wrap {
      text-align: center;
    }
    .seal-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${tmpl.sealGradient};
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
    }
    .seal-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1px solid ${tmpl.sealBorder};
      background: rgba(255,255,255,0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: ${tmpl.sealTextColor};
      text-align: center;
    }
    .seal-star {
      font-size: 9px;
      color: #b45309;
      line-height: 1;
    }
    .seal-text-top {
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .seal-text-bot {
      font-size: 6.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    .footer-right {
      text-align: right;
      min-width: 150px;
    }
    .teacher-sign-name {
      font-size: 18px;
      font-weight: 800;
      font-style: italic;
      color: #0f172a;
      border-bottom: 1px solid #94a3b8;
      padding-bottom: 2px;
      letter-spacing: 2px;
    }
    .teacher-title {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
      text-transform: uppercase;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .informal-notice {
      font-size: 9.5px;
      color: #94a3b8;
      margin-top: 3px;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
      }
      .no-print-toolbar {
        display: none !important;
      }
      .cert-page {
        margin: 0 !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: 100% !important;
        height: 100vh !important;
        border-radius: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <div>
      <div class="toolbar-title">🎓 ${docTitle}</div>
      <div class="toolbar-hint">可在浏览器中直接打印，或在 WPS / Word 中直接点击「打开」该 HTML 文件套用模板</div>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ 打印结业证书 / 另存为 PDF
    </button>
  </div>

  ${pagesContent}
</body>
</html>`;
  };

  // 1. 单人 HTML 下载 (.html)
  const handleDownloadHtml = () => {
    const tmplStyles = TEMPLATE_HTML_STYLES[selectedTemplateId];
    const logoSrc = logoBase64 || '/assets/aistudio/logo-long_aac4cdca.png';
    const pageContent = renderCertPageHtml(student, certificateText, tmplStyles, logoSrc);
    const docTitle = `结业证书_${student.name}_${semesterDisplayName}_${classDisplayName}`;
    const fullHtml = generateCompleteHtmlDocument(pageContent, docTitle, tmplStyles);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. 复制当前证书 HTML 源码到剪贴板
  const handleCopyHtml = async () => {
    try {
      const tmplStyles = TEMPLATE_HTML_STYLES[selectedTemplateId];
      const logoSrc = logoBase64 || '/assets/aistudio/logo-long_aac4cdca.png';
      const pageContent = renderCertPageHtml(student, certificateText, tmplStyles, logoSrc);
      const docTitle = `结业证书_${student.name}_${semesterDisplayName}_${classDisplayName}`;
      const fullHtml = generateCompleteHtmlDocument(pageContent, docTitle, tmplStyles);

      await navigator.clipboard.writeText(fullHtml);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Copy HTML failed:', err);
    }
  };

  // 3. 批量下载全班所有学生的结业证书 HTML (.html)
  const handleDownloadBatchClassHtml = () => {
    const stusToExport = allClassStudents.length > 0 ? allClassStudents : [student];
    const tmplStyles = TEMPLATE_HTML_STYLES[selectedTemplateId];
    const logoSrc = logoBase64 || '/assets/aistudio/logo-long_aac4cdca.png';

    const allPagesContent = stusToExport
      .map(stu => {
        const remark =
          stu.evaluation.remarks ||
          (stu.id === student.id
            ? certificateText
            : `该生在柬埔寨-东盟国际学院中文部专修课程中，课堂出勤优异，学习态度端正，乐于交流，作业认真工整，考查表现突出，特发此证，以资鼓励！`);
        return renderCertPageHtml(stu, remark, tmplStyles, logoSrc);
      })
      .join('\n');

    const docTitle = `全班结业证书批量_${semesterDisplayName}_${classDisplayName}_(共${stusToExport.length}人)`;
    const fullHtml = generateCompleteHtmlDocument(allPagesContent, docTitle, tmplStyles);

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBatchCopied(true);
    setTimeout(() => setBatchCopied(false), 2500);
  };

  // AI 重新生成量身定制结业评语
  const handleGenerateAiCommendation = async () => {
    try {
      setIsAiGenerating(true);
      const res = await fetch('/api/generate-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          gender: student.gender,
          attendanceSummary: `出勤${attStats?.presentCount || 0}天，旷课${attStats?.absentCount || 0}次`,
          homeworkSummary: `已交作业${(hwStats?.submittedCount || 0) + (hwStats?.lateCount || 0)}次`,
          scoresSummary: `期末总评分${totalScore}分，等第${gradeLevel}`,
          behaviorNotesSummary: '课堂表现良好，思维活跃，发言积极'
        })
      });
      const data = await res.json();
      if (data && data.remarks) {
        setCertificateText(data.remarks);
      }
    } catch {
      // Fallback
      setCertificateText(
        `在${semesterDisplayName}【${classDisplayName}】学习期间，学习认真刻苦，课堂活跃发言，作业按时完成，综合评定达标，特发此证以资表彰与鼓励！`
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateStudentAvatar) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      onUpdateStudentAvatar(student.id, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[80] p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="bg-white px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  柬埔寨-东盟国际学院 · 结业证书
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                  {student.name}（No.{student.no}）
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                支持以 HTML 网页格式下载与一键复制 · 双击或导入 WPS / Word / 浏览器直接排版打印
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template Selector Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {(Object.keys(TEMPLATES) as CertificateTemplateId[]).map(tid => {
                const tmpl = TEMPLATES[tid];
                const isSelected = selectedTemplateId === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setSelectedTemplateId(tid)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={`切换为【${tmpl.name}】（${tmpl.badge}）`}
                  >
                    <span>{tmpl.icon}</span>
                    <span>{tmpl.name}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Re-generate Button */}
            <button
              type="button"
              onClick={handleGenerateAiCommendation}
              disabled={isAiGenerating}
              className="px-2.5 py-1 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="根据考勤、作业及测验成绩AI生成结业寄语"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
              <span>{isAiGenerating ? 'AI构思中...' : 'AI结业评语'}</span>
            </button>

            {/* Change Avatar / Upload Photo */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
            {onOpenAvatarPicker && (
              <button
                type="button"
                onClick={() => onOpenAvatarPicker(student)}
                className="px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                title="选择萌趣动物卡通头像"
              >
                <Smile className="w-3.5 h-3.5 text-amber-600" />
                <span>换卡通头像</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="手动上传学员证件照替换头像"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>上传学员照片</span>
            </button>

            {/* Copy HTML Button */}
            <button
              type="button"
              onClick={handleCopyHtml}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isCopied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="复制当前结业证书 HTML 源码，可直接粘贴或在浏览器/WPS中打开"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isCopied ? '已复制 HTML！' : '复制 HTML'}</span>
            </button>

            {/* Download HTML Button */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
              title="以标准 HTML 网页格式下载保存结业证书 (自带打印与WPS排版样式)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>下载证书 (.html)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate View Container (支持实时视觉效果预览与直接阅读) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center custom-scrollbar">
          {/* Certificate Printable Canvas */}
          <div
            className={`w-full max-w-[840px] aspect-[1.414/1] bg-white rounded-xl shadow-2xl border-8 ${currentTemplate.outerBorder} relative p-6 sm:p-8 flex flex-col justify-between overflow-hidden select-none transition-all`}
            style={{
              background: currentTemplate.bgGradient
            }}
          >
            {/* Elegant Classical Ornamental Double Border */}
            <div className={`absolute inset-2 border-2 ${currentTemplate.innerBorder} rounded-lg pointer-events-none`} />
            <div className="absolute inset-3.5 border border-slate-400/20 rounded-md pointer-events-none" />

            {/* Corner Decorative Ornaments */}
            <div className={`absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 ${currentTemplate.cornerClass}`} />
            <div className={`absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 ${currentTemplate.cornerClass}`} />
            <div className={`absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 ${currentTemplate.cornerClass}`} />
            <div className={`absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 ${currentTemplate.cornerClass}`} />

            {/* Cute Stars / Accents if template is cute */}
            {selectedTemplateId === 'cute' && (
              <>
                <div className="absolute top-8 left-10 text-amber-400 opacity-60 text-base">★</div>
                <div className="absolute top-10 right-12 text-pink-400 opacity-60 text-lg">✨</div>
                <div className="absolute bottom-12 left-12 text-rose-300 opacity-60 text-sm">🌸</div>
                <div className="absolute bottom-14 right-16 text-yellow-400 opacity-60 text-base">★</div>
              </>
            )}

            {/* 1. Header: Official School Logo & Cambodian-ASEAN School Identity */}
            <div className="text-center pt-0.5">
              <div className="flex items-center justify-center mb-1">
                <img
                  src="/assets/aistudio/logo-long_aac4cdca.png"
                  alt="CAM-ASEAN FOREIGN LANGUAGE SCHOOL"
                  className="h-11 sm:h-13 max-w-[85%] object-contain drop-shadow-2xs"
                />
              </div>

              {/* 学校中文校名：柬埔寨-东盟国际学院 */}
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <div className="h-[1px] w-8 sm:w-12 bg-slate-300" />
                <h2 className="text-xs sm:text-sm font-serif font-black tracking-widest text-slate-800">
                  柬埔寨-东盟国际学院 · 中文部
                </h2>
                <div className="h-[1px] w-8 sm:w-12 bg-slate-300" />
              </div>
              <div className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
                CAM-ASEAN INTERNATIONAL INSTITUTE · CHINESE DEPARTMENT
              </div>
            </div>

            {/* 2. Certificate Title (调整字形好看，和正规的证书一样的) */}
            <div className="text-center my-1">
              <div className="inline-block relative">
                <h1
                  className={`text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-[0.28em] drop-shadow-2xs ${currentTemplate.titleColor}`}
                >
                  结 业 证 书
                </h1>
                <div
                  className={`text-[10px] sm:text-xs font-serif font-bold tracking-[0.25em] uppercase mt-0.5 ${currentTemplate.subtitleColor}`}
                >
                  CERTIFICATE OF COMPLETION
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-600/80" />
                  <span className="text-amber-700 text-xs font-serif">◆</span>
                  <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-600/80" />
                </div>
              </div>
            </div>

            {/* 3. Main Certificate Body (Student Info, Course with Semester, and Commendation) */}
            <div className="px-4 sm:px-8 text-center space-y-2 flex-1 flex flex-col justify-center">
              {/* Student Name & Avatar Row */}
              <div className="flex items-center justify-center gap-3">
                <StudentAvatarBadge
                  student={student}
                  size="lg"
                  className="border-2 border-white shadow-md ring-2 ring-amber-300/80"
                />
                <div className="text-left">
                  <div className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-wide">
                    {student.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>学号: No.{student.no}</span>
                    <span>·</span>
                    <span className="font-semibold text-blue-900">
                      课程: {semesterDisplayName} · {classDisplayName}
                    </span>
                  </div>
                </div>
              </div>

              {/* 正式结业证明辞 (包含学期，如 48学期 · Go Chinese-GCP) */}
              <div className="max-w-2xl mx-auto text-xs sm:text-sm font-serif text-slate-700 leading-relaxed pt-1">
                兹证明 <strong className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-400 px-1">{student.name}</strong> 同学，在
                <strong className="font-bold text-slate-900 mx-1">柬埔寨-东盟国际学院</strong>
                <strong className="font-bold text-blue-900 mx-1 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200">
                  {courseFullName}
                </strong>
                专修课程学习期间，修满规定教学课时，刻苦勤奋，品行端正。经综合考核总评成绩为
                <strong className="font-bold font-mono text-amber-900 text-base mx-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 shadow-2xs">
                  {totalScore} 分
                </strong>
                （综合等第：
                <strong className="font-bold text-emerald-800">
                  {gradeLevel}
                </strong>
                ），特准予结业，颁发此证，以资表彰与鼓励！
              </div>

              {/* 教师评语寄语引述栏 (Teacher Remark Quote) */}
              <div
                className={`max-w-xl mx-auto p-2 sm:p-2.5 rounded-lg text-[11px] sm:text-xs font-serif italic text-center leading-relaxed shadow-2xs border ${currentTemplate.quoteBg}`}
              >
                “{certificateText}”
              </div>
            </div>

            {/* 4. Footer: Signature, Seal, Serial Info & 非正式证书提示 */}
            <div className="pt-2 px-3 sm:px-6 border-t border-slate-300/60 flex items-end justify-between text-xs font-serif">
              {/* Left: Serial No & Issue Date */}
              <div className="text-left space-y-0.5">
                <div className="text-[10px] text-slate-400 font-mono">
                  证书编号: <span className="font-bold text-slate-700">{certSerial}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-600" />
                  <span>发证日期: {todayDateStr}</span>
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  授课形式: 柬东国际教学大纲 · 线下教室与线上互动融合
                </div>
              </div>

              {/* Center: Official Gold/Themed Seal Badge */}
              <div className="text-center">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br ${currentTemplate.sealGradient} p-0.5 shadow-md flex items-center justify-center border-2 border-white`}
                >
                  <div
                    className={`w-full h-full rounded-full border ${currentTemplate.sealBorder} flex flex-col items-center justify-center text-center p-1 bg-white/70 backdrop-blur-2xs`}
                  >
                    <Award className="w-3.5 h-3.5 text-amber-800" />
                    <span className="text-[8px] font-bold text-amber-950 leading-tight">
                      CAM-ASEAN
                    </span>
                    <span className="text-[6.5px] text-amber-900 font-bold uppercase tracking-tighter">
                      柬东国际学院
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Teacher Signature & 非正式证书提示 */}
              <div className="text-right space-y-0.5 min-w-[140px]">
                <div className="font-serif italic text-base sm:text-lg font-bold text-slate-900 border-b border-slate-400 pb-0.5 tracking-wide">
                  林达妮 老师
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">
                  任课教师 / CERTIFIED TEACHER
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-sans tracking-tight text-right pt-0.5 select-none">
                  ※ 非正式证书 · 仅供学习成长与阶段激励使用
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Remarks Edit Bar & HTML Actions */}
        <div className="bg-white px-5 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex-1 min-w-[260px] flex items-center gap-2">
            <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              结业证书评语微调:
            </span>
            <input
              type="text"
              value={certificateText}
              onChange={e => setCertificateText(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-serif text-slate-800"
              placeholder="可直接在此输入微调证书上的教师结业赞语..."
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {allClassStudents.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadBatchClassHtml}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                title={`一键打包下载全班全部 ${allClassStudents.length} 名学生的结业证书 HTML 文件（支持批量分页打印）`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>{batchCopied ? '已下载全班！' : `批量下载全班(${allClassStudents.length}人)`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyHtml}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                isCopied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="复制当前结业证书 HTML 源码"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isCopied ? '已复制 HTML！' : '复制 HTML'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="以 HTML 网页文件格式下载保存该学生结业证书 (带排版与打印样式)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>下载结业证书 (.html)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
