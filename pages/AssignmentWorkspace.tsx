import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Assignment, Question, AnswerOption, Profile } from "../types";
import {
  performGrading,
  getGradeColorClass,
  convertScoreToGrade,
} from "../lib/grading";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

interface WorkspaceProps {
  profile: Profile;
}

const AssignmentWorkspace: React.FC<WorkspaceProps> = ({ profile }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [letterGrade, setLetterGrade] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true);

      try {
        // Check if already submitted
        const { data: existingSub, error: subError } = await supabase
          .from("submissions")
          .select("*")
          .eq("assignment_id", id)
          .eq("student_id", profile.id)
          .maybeSingle();

        if (subError && subError.code !== "PGRST116") {
          throw subError;
        }

        if (existingSub) {
          alert("Anda sudah mengerjakan tugas ini.");
          navigate("/student");
          return;
        }

        // Fetch assignment data
        const { data: assignData, error: assignError } = await supabase
          .from("assignments")
          .select("*, course:courses(name)")
          .eq("id", id)
          .single();

        if (assignError) throw assignError;

        if (!assignData) {
          alert("Tugas tidak ditemukan.");
          navigate("/student");
          return;
        }

        // Check if assignment is published
        if (!assignData.is_published) {
          alert("Tugas ini belum dipublikasikan.");
          navigate("/student");
          return;
        }

        setAssignment(assignData);

        // Fetch all questions for the assignment
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("id, assignment_id, question_text")
          .eq("assignment_id", id)
          .order("created_at", { ascending: true });

        if (questionsError) throw questionsError;

        if (questionsData && questionsData.length > 0) {
          const questionIds = questionsData.map((q) => q.id);

          // Fetch all answer options for those questions
          const { data: optionsData, error: optionsError } = await supabase
            .from("answer_options")
            .select("id, question_id, option_text")
            .in("question_id", questionIds)
            .order("option_text", { ascending: true });

          if (optionsError) throw optionsError;

          // Combine questions with their options
          const questionsWithOptions = questionsData.map((question) => {
            const options =
              optionsData?.filter(
                (option) => option.question_id === question.id,
              ) || [];
            return {
              ...question,
              options,
            };
          });

          setQuestions(questionsWithOptions);
        } else {
          setQuestions([]);
          alert("Tugas ini belum memiliki soal.");
        }
      } catch (error: any) {
        console.error("Error fetching assignment:", error);
        alert(`Error: ${error.message || "Gagal memuat tugas"}`);
        navigate("/student");
      } finally {
        setLoading(false);
      }
    };

    if (id && profile?.id) {
      fetchAssignment();
    }
  }, [id, profile, navigate]);

  // Calculate time remaining
  useEffect(() => {
    if (!assignment?.deadline) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(assignment.deadline).getTime();
      const distance = deadline - now;

      if (distance < 0) {
        setTimeRemaining("Waktu Habis");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}h ${hours}j ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m ${seconds}d`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}d`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [assignment?.deadline]);

  // Check if all questions have been answered
  const allQuestionsAnswered =
    questions.length > 0 &&
    Object.keys(selectedAnswers).length === questions.length;

  const handleSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions have been answered
    if (!allQuestionsAnswered) {
      const confirmPartialSubmission = window.confirm(
        `Anda belum menjawab semua soal (${Object.keys(selectedAnswers).length}/${questions.length}). Tetap ingin mengumpulkan jawaban?`
      );
      if (!confirmPartialSubmission) return;
    } else {
      if (!window.confirm('Apakah Anda yakin ingin mengumpulkan jawaban?')) return;
    }

    setSubmitting(true);

    try {
      // Log the answers being sent for debugging
      console.log('Sending answers:', selectedAnswers);

      const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
        question_id: qId,
        selected_option_id: oId
      }));

      console.log('Formatted answers for RPC:', answers);

      // Call the secure RPC function
      const { data, error } = await supabase
        .rpc('submit_assignment', {
          p_assignment_id: id,
          p_student_id: profile.id,
          p_answers: answers  // Send as array of objects, Supabase will handle JSON conversion
        });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      // Data returned from RPC: { submission_id, score, correct_count, total_questions }
      const result = data as any;
      console.log('Submission result:', result);

      setFinalScore(result.score);
      setLetterGrade(convertScoreToGrade(result.score));

      // We can't fetch correct answers directly due to security constraints
      // Instead, we'll rely on the RPC function returning detailed results
      // if the function was updated to return per-question results

      // Update the questions with correct answers if available in the result
      if (result.details) {
        const details = result.details;
        const updatedQuestions = [...questions];

        details.forEach((detail: any) => {
          const questionIdx = updatedQuestions.findIndex(q => q.id === detail.question_id);
          if (questionIdx !== -1) {
            updatedQuestions[questionIdx] = {
              ...updatedQuestions[questionIdx],
              correct_option_id: detail.correct_option_id
            };
          }
        });

        setQuestions(updatedQuestions);
      }

      setIsDone(true);

    } catch (err: any) {
      console.error('Submission error:', err);
      alert('Error: ' + (err.message || 'Terjadi kesalahan saat mengumpulkan jawaban'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Memuat tugas...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Tugas Tidak Ditemukan
          </h2>
          <p className="text-slate-600 mb-4">
            Tugas yang Anda cari tidak tersedia.
          </p>
          <button
            onClick={() => navigate("/student")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-4">
                Tugas Terkirim!
              </h2>
              <p className="text-slate-500 mt-2">
                Jawaban Anda telah berhasil kami simpan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 rounded-2xl p-6 text-center animate-in slide-in-from-left duration-500">
                <span className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Nilai Angka
                </span>
                <span className="text-4xl font-black text-blue-600">
                  {finalScore}%
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 text-center animate-in slide-in-from-right duration-500">
                <span className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Nilai Huruf
                </span>
                <span
                  className={`text-4xl font-black ${getGradeColorClass(letterGrade).split(" ")[1]}`}
                >
                  {letterGrade}
                </span>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-slate-600">
                Untuk melihat detail jawaban dan pembahasan, silakan hubungi
                pengajar Anda.
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate("/student")}
                className="w-full md:w-auto bg-slate-900 text-white py-4 px-8 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle size={64} className="text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Belum Ada Soal
          </h2>
          <p className="text-slate-600 mb-4">
            Tugas ini belum memiliki soal. Silakan hubungi pengajar Anda.
          </p>
          <button
            onClick={() => navigate("/student")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">
                {assignment.title}
              </h1>
              <p className="text-xs text-slate-500">
                {assignment.course?.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-orange-600 gap-1 text-sm font-bold">
              <Clock size={16} />
              <span className="hidden sm:inline">Sisa: </span>
              <span>{timeRemaining}</span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {new Date(assignment.deadline).toLocaleDateString("id-ID")}
            </span>
          </div>
        </div>
        <div className="h-1 bg-slate-100 w-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Question Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  Soal {currentIndex + 1}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  dari {questions.length}
                </span>
              </div>
              <div
                className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
                  selectedAnswers[currentQuestion?.id]
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {selectedAnswers[currentQuestion?.id]
                  ? "✓ Terjawab"
                  : "Belum Terjawab"}
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-8 leading-relaxed">
              {currentQuestion?.question_text}
            </h2>

            <div className="space-y-3">
              {currentQuestion?.options.map((option: any, idx: number) => {
                const isSelected =
                  selectedAnswers[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(currentQuestion.id, option.id)}
                    className={`
                      w-full text-left p-4 md:p-5 rounded-xl border transition-all flex items-start gap-4 group
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                      }
                    `}
                  >
                    <div
                      className={`
                      mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                      ${isSelected ? "border-blue-600 bg-blue-600" : "border-slate-400 group-hover:border-blue-500"}
                    `}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-slate-700 flex-grow">
                      {option.option_text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pb-10">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all ${
                allQuestionsAnswered
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengirim...
                </span>
              ) : allQuestionsAnswered ? (
                "Selesai & Kumpulkan"
              ) : (
                <span className="text-sm sm:text-base">
                  Lanjutkan (
                  {questions.length - Object.keys(selectedAnswers).length}{" "}
                  belum)
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1),
                )
              }
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg flex items-center gap-2 transition-all"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Answer Summary Overlay (Mobile Friendly) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 md:hidden z-50 shadow-lg">
        <div className="flex gap-1 overflow-x-auto px-2 pb-1 scrollbar-hide">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers.hasOwnProperty(q.id);
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  relative flex-shrink-0 w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center
                  transition-all
                  ${
                    isCurrent
                      ? "bg-blue-600 text-white ring-2 ring-blue-300 scale-110"
                      : isAnswered
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-400"
                  }
                `}
                title={`Soal ${idx + 1} ${isAnswered ? "(Terjawab)" : "(Belum Terjawab)"}`}
              >
                {idx + 1}
                {!isAnswered && !isCurrent && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop version of question navigation */}
      <div className="hidden md:block fixed right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-xl border border-slate-200 p-3 shadow-lg max-h-[60vh] overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-700 px-2 mb-2">
          Navigasi Soal
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers.hasOwnProperty(q.id);
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  relative w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center
                  transition-all
                  ${
                    isCurrent
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : isAnswered
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-400"
                  }
                `}
                title={`Soal ${idx + 1} ${isAnswered ? "(Terjawab)" : "(Belum Terjawab)"}`}
              >
                {idx + 1}
                {!isAnswered && !isCurrent && (
                  <span className="absolute w-3 h-3 bg-red-500 rounded-full text-[6px] text-white flex items-center justify-center -top-0.5 -right-0.5">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssignmentWorkspace;
