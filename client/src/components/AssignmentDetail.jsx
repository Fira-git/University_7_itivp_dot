import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, 
  Award, 
  Clock, 
  CheckCircle2, 
  Paperclip, 
  Download, 
  MessageSquare, 
  UploadCloud, 
  Send,
  FileText
} from 'lucide-react';
import api, { API_BASE_URL } from '../api';
import { formatFileName } from '../utils/format';

export default function AssignmentDetail({ 
  assignment: initialAssignment, 
  user: initialUser,
  userRole: initialUserRole, 
  onBack, 
  onRefresh 
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(initialAssignment || null);
  const [loading, setLoading] = useState(!initialAssignment);
  
  // Определяем роль: либо из объекта user, либо из пропса userRole
  const user = initialUser || JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = initialUserRole || user?.role;

  const [solutionFiles, setSolutionFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [gradeValue, setGradeValue] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const targetId = id || initialAssignment?.id;
      if (!targetId) return;
      const res = await api.get(`/assignments/${targetId}`);
      setAssignment(res.data);
      setGradeValue(res.data.grade !== null && res.data.grade !== undefined ? res.data.grade : '');
      setFeedbackText(res.data.feedback || '');
    } catch (err) {
      console.error(err);
      alert('Не удалось загрузить задание');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialAssignment && id) {
      fetchAssignment();
    } else if (initialAssignment) {
      setAssignment(initialAssignment);
      setGradeValue(initialAssignment.grade !== null && initialAssignment.grade !== undefined ? initialAssignment.grade : '');
      setFeedbackText(initialAssignment.feedback || '');
    }
  }, [id, initialAssignment]);

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
    await fetchAssignment();
  };

  const hasGrade = assignment?.grade !== null && assignment?.grade !== undefined;


  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (solutionFiles.length === 0) {
      alert('Выберите хотя бы один файл');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < solutionFiles.length; i++) {
        formData.append('submissions', solutionFiles[i]);
      }

      // Отправляем БЕЗ явного Content-Type — Axios и браузер выставят multipart/form-data с boundary сами
      await api.post(`/assignments/${assignment.id}/submit`, formData);

      setSolutionFiles([]);
      await handleRefresh();
      alert('Работа успешно отправлена на оценку!');

    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.error || 'Ошибка при отправке работы';
      alert(`Ошибка: ${serverMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    setIsGrading(true);
    try {
            await api.put(`/assignments/${assignment.id}`, {
        grade: Number(gradeValue),
        feedback: feedbackText
      });
      await handleRefresh();
      alert('Оценка и рецензия сохранены!');

    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении оценки');
    } finally {
      setIsGrading(false);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'Оценено') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Оценено
        </span>
      );
    }
    if (status === 'Отправлено на оценку') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Send className="w-3.5 h-3.5 text-sky-600" />
          Отправлено на оценку
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-4 h-4 text-amber-600" />
        Выдано
      </span>
    );
  };

    if (loading) {
    return <div className="py-20 text-center text-slate-400 text-sm">Загрузка данных задания...</div>;
  }

  if (!assignment) {
    return <div className="py-20 text-center text-slate-400 text-sm">Задание не найдено</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <button
        onClick={() => onBack ? onBack() : navigate(-1)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад ко всем заданиям
      </button>


      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              {renderStatusBadge(assignment.status)}

              {hasGrade ? (
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border ${
                  assignment.grade >= 80 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : assignment.grade >= 60 
                    ? 'bg-amber-50 text-amber-800 border-amber-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <Award className="w-4 h-4" />
                  {assignment.grade} / 100 баллов
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Без оценки</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {assignment.title}
            </h1>
          </div>
        </div>

        {/* Тело задания: рендеринг Markdown */}
        <div className="pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Условия и описание работы
          </h3>
          <div className="text-slate-800 leading-relaxed text-sm bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            {assignment.description ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-900 mt-4 mb-3 pb-2 border-b border-slate-200" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 mt-4 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-semibold text-slate-800 mt-3 mb-1.5" {...props} />,
                  p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-3" {...props} />,
                  code: ({node, inline, ...props}) => inline 
                    ? <code className="px-1.5 py-0.5 rounded bg-slate-200/70 text-emerald-800 font-mono text-xs" {...props} />
                    : <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto my-3"><code {...props} /></pre>,
                  img: ({node, ...props}) => <img className="rounded-xl border border-slate-200 max-h-[500px] my-4 shadow-sm" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 italic text-slate-600 my-3" {...props} />
                }}
              >
                {assignment.description}
              </ReactMarkdown>
            ) : (
              <p className="text-slate-400 italic">Описание задания отсутствует.</p>
            )}
          </div>
        </div>

        {/* Материалы преподавателя */}
        {assignment.materials && assignment.materials.length > 0 && (
          <div className="pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Материалы преподавателя ({assignment.materials.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignment.materials.map((file, idx) => (
                <a
                  key={idx}
                  href={`${API_BASE_URL}${file.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-xs text-slate-700 hover:bg-slate-50 transition-all shadow-sm group"
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">{formatFileName(file.name)}</span>
                  </span>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Рецензия и комментарий */}
      {assignment.feedback && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Рецензия и замечания преподавателя:
          </div>
          <p className="text-slate-700 text-sm italic leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-emerald-400">
            {assignment.feedback}
          </p>
        </div>
      )}

      {/* Файлы студента */}
      {assignment.submissions && assignment.submissions.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-700 mb-3">
            Отправленные решения ({assignment.submissions.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignment.submissions.map((file, idx) => (
              <a
                key={idx}
                href={`${API_BASE_URL}${file.url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 hover:border-sky-400 text-xs text-sky-950 transition-all shadow-sm group"
              >
                <span className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="font-semibold truncate">{formatFileName(file.name)}</span>
                </span>
                <Download className="w-4 h-4 text-sky-500 group-hover:text-sky-700 shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Блок студента: загрузка решений */}
      {userRole === 'user' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {assignment.status === 'Выдано' ? 'Сдать выполненную работу' : 'Дослать файлы к решению'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Прикрепите файлы решения. Задание перейдет в статус «Отправлено на оценку».
          </p>

          <form onSubmit={handleSubmitSolution} className="space-y-4">
            <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center bg-emerald-50/20 hover:bg-emerald-50/50 transition-colors">
              <input
                type="file"
                multiple
                required
                id="page-solution-files"
                className="hidden"
                onChange={(e) => setSolutionFiles(Array.from(e.target.files))}
              />
              <label htmlFor="page-solution-files" className="cursor-pointer block">
                <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <span className="text-sm font-semibold text-emerald-700 block">
                  Нажмите для выбора файлов
                </span>
                <span className="text-xs text-slate-400">Любые форматы (ZIP, PDF, JS, DOCX)</span>
              </label>
            </div>

            {solutionFiles.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold block mb-1">Выбрано файлов ({solutionFiles.length}):</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {solutionFiles.map((f, i) => (
                    <li key={i} className="truncate">{f.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || solutionFiles.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Отправка...' : 'Отправить на оценку'}
            </button>
          </form>
        </div>
      )}

      {/* Блок преподавателя: Оценка 0-100 и комментарий */}
      {(userRole === 'moderator' || userRole === 'admin') && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Оценивание работы и обратная связь
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            При выставлении оценки задание автоматически перейдёт в статус «Оценено».
          </p>

          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div className="max-w-xs">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Итоговый балл (от 0 до 100)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  placeholder="95"
                  className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-slate-200 text-base font-bold focus:outline-none focus:border-emerald-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  / 100
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Развёрнутый комментарий / Рецензия
              </label>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Укажите плюсы решения, замечания или рекомендации..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGrading}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              {isGrading ? 'Сохранение...' : 'Поставить оценку'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}