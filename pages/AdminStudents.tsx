import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Profile, Class, Semester } from "../types";
import {
  Search,
  Mail,
  User,
  GraduationCap,
  ArrowRight,
  BookOpen,
  Calendar,
  Save,
} from "lucide-react";

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStudent, setUpdatingStudent] = useState<string | null>(null); // Track which student is being updated
  const [studentUpdates, setStudentUpdates] = useState<
    Record<string, { class_id: string | null; semester_id: string | null }>
  >({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: stdData } = await supabase
      .from("profiles")
      .select("*, class:classes(name), semester:semesters(name)")
      .eq("role", "STUDENT")
      .order("full_name");

    const { data: clsData } = await supabase.from("classes").select("*");
    const { data: semData } = await supabase.from("semesters").select("*");

    if (stdData) setStudents(stdData);
    if (clsData) setClasses(clsData);
    if (semData) setSemesters(semData);
    setLoading(false);
  };

  // Initialize student updates when students load
  useEffect(() => {
    const initialUpdates: Record<
      string,
      { class_id: string | null; semester_id: string | null }
    > = {};
    students.forEach((student) => {
      initialUpdates[student.id] = {
        class_id: student.class_id || null,
        semester_id: student.semester_id || null,
      };
    });
    setStudentUpdates(initialUpdates);
  }, [students]);

  const handleClassChange = (studentId: string, classId: string) => {
    setStudentUpdates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        class_id: classId || null,
      },
    }));
  };

  const handleSemesterChange = (studentId: string, semesterId: string) => {
    setStudentUpdates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        semester_id: semesterId || null,
      },
    }));
  };

  const updateStudent = async (studentId: string) => {
    setUpdatingStudent(studentId);

    const updates = studentUpdates[studentId];
    if (!updates) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        class_id: updates.class_id,
        semester_id: updates.semester_id,
      })
      .eq("id", studentId);

    if (error) {
      console.error("Error updating student:", error);
      alert(`Gagal memperbarui data mahasiswa: ${error.message}`);
    } else {
      // Update the local student record to reflect the change
      setStudents((prev) =>
        prev.map((std) =>
          std.id === studentId
            ? {
                ...std,
                class_id: updates.class_id,
                semester_id: updates.semester_id,
              }
            : std,
        ),
      );
    }

    setUpdatingStudent(null);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Manajemen Mahasiswa
        </h1>
        <p className="text-slate-500 text-sm">
          Daftar mahasiswa terdaftar dan pengaturan kelas serta semester mereka.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari mahasiswa berdasarkan nama atau email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">Mahasiswa</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Semester Aktif</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((std) => (
                <tr
                  key={std.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        <User size={18} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 text-sm block">
                          {std.full_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {std.nim || "NIM tidak tersedia"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="text-slate-400" size={16} />
                      <select
                        className="text-sm bg-slate-50 border border-slate-200 rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                        value={
                          studentUpdates[std.id]?.class_id || std.class_id || ""
                        }
                        onChange={(e) =>
                          handleClassChange(std.id, e.target.value)
                        }
                      >
                        <option value="">Pilih Kelas...</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {std.class?.name && (
                      <div className="mt-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block">
                        {std.class.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-slate-400" size={16} />
                      <select
                        className="text-sm bg-slate-50 border border-slate-200 rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                        value={
                          studentUpdates[std.id]?.semester_id ||
                          std.semester_id ||
                          ""
                        }
                        onChange={(e) =>
                          handleSemesterChange(std.id, e.target.value)
                        }
                      >
                        <option value="">Pilih Semester...</option>
                        {semesters.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {std.semester?.name && (
                      <div className="mt-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block">
                        {std.semester.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => updateStudent(std.id)}
                      disabled={updatingStudent === std.id}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                        updatingStudent === std.id
                          ? "bg-slate-200 text-slate-500"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {updatingStudent === std.id ? (
                        <>
                          <div className="w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Simpan
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    {searchTerm
                      ? "Tidak ada mahasiswa yang cocok dengan pencarian."
                      : "Belum ada mahasiswa terdaftar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <GraduationCap className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Mahasiswa</p>
              <p className="text-xl font-bold text-slate-900">
                {students.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <BookOpen className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Jumlah Kelas</p>
              <p className="text-xl font-bold text-slate-900">
                {classes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-5 rounded-xl border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Jumlah Semester</p>
              <p className="text-xl font-bold text-slate-900">
                {semesters.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;
