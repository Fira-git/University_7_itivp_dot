import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDebounce } from '../utils/useDebounce';
import { 
  Plus, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  Paperclip, 
  Users, 
  Search, 
  Filter, 
  X,
  Award,
  ArrowRight,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Прием 1: Debounce поиска
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, studentsRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/assignments/students')
      ]);
      setAssignments(assignmentsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStudentSelection = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      alert('Выберите хотя бы одного студента');
      return;
    }

    setCreateSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('description', newDescription);
      formData.append('studentIds', JSON.stringify(selectedStudentIds));

      for (let i = 0; i < attachedFiles.length; i++) {
        formData.append('materials', attachedFiles[i]);
      }

      await api.post('/assignments', formData);

      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setSelectedStudentIds([]);
      setAttachedFiles([]);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании задания');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Прием 3: useMemo для фильтрации заданий
  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const matchesSearch = item.title.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [assignments, filterStatus, debouncedSearch]);

  const renderStatusBadge = (status) => {
    if (status === 'Оценено') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Оценено
        </span>
      );
    }
    if (status === 'Отправлено на оценку') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Send className="w-3 h-3 text-sky-600" />
          Отправлено на оценку
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Выдано
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Панель управления преподавателя</h2>
          <p className="text-sm text-slate-500 mt-1">
            Выдача расширенных заданий в Markdown, проверка решений и оценивание по 100-балльной шкале
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Выдать новое задание
        </button>
      </div>

      {/* Поиск и фильтры по всем 3 статусам */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
          {['ALL', 'Выдано', 'Отправлено на оценку', 'Оценено'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Все' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Список заданий */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Загрузка списка заданий...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-sm">Заданий не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => {
            const student = students.find(s => s.id === assignment.studentId);
            const hasGrade = assignment.grade !== null && assignment.grade !== undefined;

            return (
                            <div 
                key={assignment.id} 
                onClick={() => navigate(`/assignments/${assignment.id}`)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-400 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {renderStatusBadge(assignment.status)}

                    {hasGrade ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Award className="w-3.5 h-3.5" />
                        {assignment.grade} / 100
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Без оценки</span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-3 group-hover:text-emerald-700 transition-colors">
                    {assignment.title}
                  </h3>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">Студент: <b>{student?.email || `ID ${assignment.studentId}`}</b></span>
                  </div>

                  {assignment.materials && assignment.materials.length > 0 && (
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Материалов: <b>{assignment.materials.length}</b></span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  <span>Проверить / Оценить</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно создания задания */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-900">Выдача нового задания</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Тема задания
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Лабораторная работа №2"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Описание и критерии (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewMarkdown(!previewMarkdown)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {previewMarkdown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {previewMarkdown ? 'Вернуться к редактору' : 'Предпросмотр Markdown'}
                  </button>
                </div>

                {previewMarkdown ? (
                  <div className="w-full min-h-[140px] p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm overflow-y-auto max-h-60">
                    {newDescription ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {newDescription}
                      </ReactMarkdown>
                    ) : (
                      <span className="text-slate-400 italic">Описание пока пустое...</span>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={5}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="# Требования к работе&#10;- Шаг 1&#10;- Шаг 2&#10;`npm test`&#10;![Схема](https://...)"
                      className="w-full px-3.5 py-2 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Поддерживаются заголовки (#), списки (-), код (```), ссылки и картинки (![alt](url)).
                    </span>
                  </div>
                )}
              </div>

              {/* Выбор студентов */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Студенты ({selectedStudentIds.length} выбрано)
                  </label>
                  <button
                    type="button"
                    onClick={selectAllStudents}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {selectedStudentIds.length === students.length ? 'Снять всех' : 'Выбрать всех'}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1 bg-slate-50/50">
                  {students.map(student => (
                    <label 
                      key={student.id} 
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="font-medium text-slate-700">{student.email}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Загрузка методичек */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Материалы и файлы условий
                </label>
                <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input
                    type="file"
                    multiple
                    id="teacher-material-files"
                    className="hidden"
                    onChange={(e) => setAttachedFiles(Array.from(e.target.files))}
                  />
                  <label htmlFor="teacher-material-files" className="cursor-pointer block">
                    <UploadCloud className="w-7 h-7 text-emerald-600 mx-auto mb-1"/>
                    <span className="text-xs font-semibold text-emerald-700 block">Выбрать файлы</span>
                    <span className="text-[11px] text-slate-400">PDF, ZIP, DOCX</span>
                  </label>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="mt-2 text-xs text-slate-600">
                    Выбрано: <b>{attachedFiles.length}</b> ({attachedFiles.map(f => f.name).join(', ')})
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60"
                >
                  {createSubmitting ? 'Создание...' : 'Выдать студентам'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}