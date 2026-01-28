import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

type Option = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
};

type Question = {
  id: string;
  assignment_id: string;
  question_text: string;
  correct_option_id?: string | null;
  options: Option[];
};

type Assignment = {
  id: string;
  title: string;
  is_published: boolean;
  course?: { name: string };
};

const AdminAssignmentEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Local state to maintain form values during editing
  const [localQuestionTexts, setLocalQuestionTexts] = useState<
    Record<string, string>
  >({});
  const [localOptionTexts, setLocalOptionTexts] = useState<
    Record<string, string>
  >({});

  // Track which questions have unsaved changes
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);

    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("id, title, is_published, course:courses(name)")
        .eq("id", id)
        .single();

      if (assignmentError) throw assignmentError;

      setAssignment(assignmentData);

      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .select("*")
        .eq("assignment_id", id)
        .order("created_at", { ascending: true });

      if (questionError) throw questionError;

      const questionIds = questionData.map((q) => q.id);

      if (questionIds.length > 0) {
        const { data: optionData, error: optionError } = await supabase
          .from("answer_options")
          .select("*")
          .in("question_id", questionIds);

        if (optionError) throw optionError;

        const merged = questionData.map((q) => ({
          ...q,
          options: optionData.filter((o) => o.question_id === q.id),
        }));

        setQuestions(merged);

        // Initialize local state with current values
        const initialQuestionTexts: Record<string, string> = {};
        const initialOptionTexts: Record<string, string> = {};

        merged.forEach((q) => {
          initialQuestionTexts[q.id] = q.question_text;
          q.options.forEach((opt) => {
            initialOptionTexts[opt.id] = opt.option_text;
          });
        });

        setLocalQuestionTexts(initialQuestionTexts);
        setLocalOptionTexts(initialOptionTexts);
      } else {
        setQuestions([]);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!id) return;
    setAdding(true);

    try {
      const { data: question, error } = await supabase
        .from("questions")
        .insert({ assignment_id: id, question_text: "" })
        .select()
        .single();

      if (error) throw error;

      const optionLabels = ["", "", "", ""];
      const optionsToInsert = optionLabels.map((label) => ({
        question_id: question.id,
        option_text: ` ${label}`,
        is_correct: false,
      }));

      const { data: insertedOptions, error: optionError } = await supabase
        .from("answer_options")
        .insert(optionsToInsert)
        .select();

      if (optionError) throw optionError;

      // Update local state with new question
      setLocalQuestionTexts((prev) => ({
        ...prev,
        [question.id]: "Pertanyaan baru...",
      }));

      insertedOptions.forEach((opt) => {
        setLocalOptionTexts((prev) => ({
          ...prev,
          [opt.id]: opt.option_text,
        }));
      });

      // Refresh the questions list
      await fetchAll();
    } catch (error: any) {
      console.error("Error adding question:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menghapus soal ini beserta semua pilihan jawabannya?",
      )
    ) {
      return;
    }

    setDeleting(questionId);

    try {
      // Delete all answer options associated with the question first
      const { error: optionError } = await supabase
        .from("answer_options")
        .delete()
        .eq("question_id", questionId);

      if (optionError) throw optionError;

      // Then delete the question itself
      const { error: questionError } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (questionError) throw questionError;

      // Update local state to remove the question
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setLocalQuestionTexts((prev) => {
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
      });

      // Remove all options for this question
      const optionsToRemove =
        questions.find((q) => q.id === questionId)?.options.map((o) => o.id) ||
        [];

      setLocalOptionTexts((prev) => {
        const newState = { ...prev };
        optionsToRemove.forEach((optId) => {
          delete newState[optId];
        });
        return newState;
      });

      // Remove from unsaved changes
      setUnsavedChanges((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    } catch (error: any) {
      console.error("Error deleting question:", error);
      alert(`Gagal menghapus soal: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleQuestionTextChange = (questionId: string, value: string) => {
    setLocalQuestionTexts((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Mark as having unsaved changes
    setUnsavedChanges((prev) => new Set(prev).add(questionId));
  };

  const handleOptionTextChange = (
    questionId: string,
    optionId: string,
    value: string,
  ) => {
    setLocalOptionTexts((prev) => ({
      ...prev,
      [optionId]: value,
    }));

    // Mark as having unsaved changes
    setUnsavedChanges((prev) => new Set(prev).add(questionId));
  };

  const saveQuestion = async (questionId: string) => {
    setSaving(questionId);

    try {
      const question = questions.find((q) => q.id === questionId);
      if (!question) return;

      // Validate question text
      const questionText = localQuestionTexts[questionId];
      if (!questionText || questionText.trim() === "") {
        alert("Teks pertanyaan tidak boleh kosong");
        return;
      }

      // Update question text
      const { error: questionError } = await supabase
        .from("questions")
        .update({ question_text: questionText })
        .eq("id", questionId);

      if (questionError) throw questionError;

      // Update all options for this question
      const optionUpdates = question.options.map((opt) => ({
        id: opt.id,
        option_text: localOptionTexts[opt.id] || opt.option_text,
      }));

      for (const update of optionUpdates) {
        const { error: optionError } = await supabase
          .from("answer_options")
          .update({ option_text: update.option_text })
          .eq("id", update.id);

        if (optionError) throw optionError;
      }

      // Remove from unsaved changes
      setUnsavedChanges((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });

      // Show success message
      const questionElement = document.getElementById(`question-${questionId}`);
      if (questionElement) {
        questionElement.classList.add("ring-2", "ring-green-500");
        setTimeout(() => {
          questionElement.classList.remove("ring-2", "ring-green-500");
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error saving question:", error);
      alert(`Gagal menyimpan: ${error.message}`);
    } finally {
      setSaving(null);
    }
  };

  const setCorrect = async (questionId: string, optionId: string) => {
    try {
      // First, unset all options for this question
      const { error: unsetError } = await supabase
        .from("answer_options")
        .update({ is_correct: false })
        .eq("question_id", questionId);

      if (unsetError) throw unsetError;

      // Then set the selected option as correct
      const { error: setError } = await supabase
        .from("answer_options")
        .update({ is_correct: true })
        .eq("id", optionId);

      if (setError) throw setError;

      // Update the question's correct_option_id
      const { error: updateQuestionError } = await supabase
        .from("questions")
        .update({ correct_option_id: optionId })
        .eq("id", questionId);

      if (updateQuestionError) throw updateQuestionError;

      // Update local state
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === questionId) {
            return {
              ...q,
              correct_option_id: optionId,
              options: q.options.map((opt) => ({
                ...opt,
                is_correct: opt.id === optionId,
              })),
            };
          }
          return q;
        }),
      );

      // Visual feedback
      const optionElement = document.getElementById(`option-${optionId}`);
      if (optionElement) {
        optionElement.classList.add("ring-2", "ring-green-500");
        setTimeout(() => {
          optionElement.classList.remove("ring-2", "ring-green-500");
        }, 500);
      }
    } catch (error: any) {
      console.error("Error setting correct answer:", error);
      alert(`Gagal menetapkan jawaban benar: ${error.message}`);
    }
  };

  const togglePublish = async () => {
    if (!assignment) return;

    // Validate before publishing
    if (!assignment.is_published) {
      // Check if there are questions
      if (questions.length === 0) {
        alert("Tidak dapat mempublikasikan tugas tanpa soal");
        return;
      }

      // Check if all questions have correct answers
      const questionsWithoutCorrectAnswer = questions.filter(
        (q) => !q.options.some((opt) => opt.is_correct),
      );

      if (questionsWithoutCorrectAnswer.length > 0) {
        const proceed = window.confirm(
          `Ada ${questionsWithoutCorrectAnswer.length} soal yang belum memiliki jawaban benar. Tetap publikasikan?`,
        );
        if (!proceed) return;
      }

      // Check for unsaved changes
      if (unsavedChanges.size > 0) {
        const proceed = window.confirm(
          `Ada ${unsavedChanges.size} soal dengan perubahan yang belum disimpan. Tetap publikasikan?`,
        );
        if (!proceed) return;
      }
    }

    try {
      const { error } = await supabase
        .from("assignments")
        .update({ is_published: !assignment.is_published })
        .eq("id", assignment.id);

      if (error) throw error;

      await fetchAll();
    } catch (error: any) {
      console.error("Error toggling publish:", error);
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Memuat Editor…</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-8 text-red-500 text-center">
        <AlertCircle size={48} className="mx-auto mb-4" />
        <p className="font-bold text-xl">Tugas tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-white z-20 py-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/assignments")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{assignment.title}</h1>
            <p className="text-sm text-slate-500">
              {assignment.course?.name} • {questions.length} Soal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unsavedChanges.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-semibold">
              <AlertCircle size={16} />
              {unsavedChanges.size} perubahan belum disimpan
            </div>
          )}
          <button
            onClick={togglePublish}
            disabled={questions.length === 0}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all ${
              assignment.is_published
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                : questions.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {assignment.is_published ? (
              <>
                <EyeOff size={18} /> Unpublish
              </>
            ) : (
              <>
                <Eye size={18} /> Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {assignment.is_published && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            <strong>Tugas telah dipublikasikan.</strong> Mahasiswa dapat
            mengerjakan tugas ini. Perubahan yang Anda buat akan langsung
            terlihat.
          </p>
        </div>
      )}

      {/* Questions List */}
      {questions.map((q, i) => {
        const hasUnsavedChanges = unsavedChanges.has(q.id);
        const hasCorrectAnswer = q.options.some((opt) => opt.is_correct);

        return (
          <div
            key={q.id}
            id={`question-${q.id}`}
            className={`bg-white p-6 rounded-xl border relative transition-all ${
              hasUnsavedChanges
                ? "border-orange-300 bg-orange-50/20"
                : "border-slate-200"
            }`}
          >
            {/* Question Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">Soal #{i + 1}</span>
                {hasUnsavedChanges && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                    Belum Disimpan
                  </span>
                )}
                {!hasCorrectAnswer && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> Tanpa Jawaban Benar
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <button
                    onClick={() => saveQuestion(q.id)}
                    disabled={saving === q.id}
                    className={`p-2 rounded-full transition-all ${
                      saving === q.id
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-green-100 text-green-600 hover:bg-green-200"
                    }`}
                    title="Simpan perubahan"
                  >
                    {saving === q.id ? (
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save size={16} />
                    )}
                  </button>
                )}
                <button
                  onClick={() => deleteQuestion(q.id)}
                  disabled={deleting === q.id}
                  className={`p-2 rounded-full transition-all ${
                    deleting === q.id
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-red-100 text-red-600 hover:bg-red-200"
                  }`}
                  title="Hapus soal"
                >
                  {deleting === q.id ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Question Text */}
            <textarea
              value={localQuestionTexts[q.id] ?? q.question_text}
              onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Masukkan pertanyaan di sini..."
            />

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <div
                  key={opt.id}
                  id={`option-${opt.id}`}
                  className="flex gap-3"
                >
                  <button
                    onClick={() => setCorrect(q.id, opt.id)}
                    className={`p-2 rounded-lg w-10 h-10 flex items-center justify-center font-bold transition-all ${
                      opt.is_correct
                        ? "bg-green-500 text-white ring-2 ring-green-300"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                    title={
                      opt.is_correct
                        ? "Jawaban benar"
                        : "Klik untuk menjadikan jawaban benar"
                    }
                  >
                    {opt.is_correct ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <span>{String.fromCharCode(65 + idx)}</span>
                    )}
                  </button>

                  <input
                    value={localOptionTexts[opt.id] ?? opt.option_text}
                    onChange={(e) =>
                      handleOptionTextChange(q.id, opt.id, e.target.value)
                    }
                    className="flex-1 border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder={`Opsi ${String.fromCharCode(65 + idx)}...`}
                  />
                </div>
              ))}
            </div>

            {/* Save Button for Question */}
            {hasUnsavedChanges && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => saveQuestion(q.id)}
                  disabled={saving === q.id}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all ${
                    saving === q.id
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {saving === q.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Question Button */}
      <button
        onClick={addQuestion}
        disabled={adding}
        className={`w-full border-2 border-dashed p-8 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
          adding
            ? "border-slate-300 text-slate-400 cursor-not-allowed"
            : "border-slate-300 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50"
        }`}
      >
        {adding ? (
          <>
            <div className="w-7 h-7 border-4 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Menambahkan Soal...</span>
          </>
        ) : (
          <>
            <Plus size={28} />
            <span className="font-semibold">Tambah Soal Pilihan Ganda</span>
          </>
        )}
      </button>

      {questions.length === 0 && !adding && (
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">
            Belum ada soal. Klik tombol di atas untuk menambahkan soal pertama.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminAssignmentEditor;
