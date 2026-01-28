/**
 * Fungsi untuk mengonversi skor numerik (0-100) ke nilai huruf
 * berdasarkan rentang nilai yang telah ditentukan
 */
export function convertScoreToGrade(score: number): string {
  if (score >= 90) {
    return 'A';
  } else if (score >= 85) {
    return 'A-';
  } else if (score >= 80) {
    return 'B+';
  } else if (score >= 75) {
    return 'B';
  } else if (score >= 70) {
    return 'B-';
  } else if (score >= 65) {
    return 'C+';
  } else if (score >= 60) {
    return 'C';
  } else if (score >= 55) {
    return 'C-';
  } else {
    return 'F'; // Menambahkan nilai F untuk skor di bawah 55%
  }
}

/**
 * Fungsi untuk mendapatkan kelas CSS berdasarkan nilai huruf
 * untuk menyesuaikan warna tampilan di UI
 */
export function getGradeColorClass(letterGrade: string): string {
  switch (letterGrade) {
    case 'A':
      return 'bg-indigo-100 text-indigo-700';
    case 'A-':
      return 'bg-purple-100 text-purple-700';
    case 'B+':
      return 'bg-blue-100 text-blue-700';
    case 'B':
      return 'bg-cyan-100 text-cyan-700';
    case 'B-':
      return 'bg-teal-100 text-teal-700';
    case 'C+':
      return 'bg-emerald-100 text-emerald-700';
    case 'C':
      return 'bg-green-100 text-green-700';
    case 'C-':
      return 'bg-yellow-100 text-yellow-700';
    default: // Termasuk F dan nilai lainnya
      return 'bg-red-100 text-red-700';
  }
}

/**
 * Fungsi untuk menghitung skor akhir dalam persentase
 * @param correctAnswers Jumlah jawaban benar
 * @param totalQuestions Jumlah total pertanyaan
 * @returns Skor dalam persentase (0-100)
 */
export function calculatePercentageScore(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions <= 0) {
    return 0;
  }
  return Math.round((correctAnswers / totalQuestions) * 100);
}

/**
 * Interface untuk hasil penilaian
 */
export interface GradingResult {
  numericScore: number; // Skor dalam bentuk angka (0-100)
  letterGrade: string;  // Nilai dalam bentuk huruf (A, A-, B+, dll.)
  correctAnswers: number; // Jumlah jawaban benar
  totalQuestions: number; // Jumlah total pertanyaan
}

/**
 * Fungsi untuk melakukan penilaian lengkap
 * @param correctAnswers Jumlah jawaban benar
 * @param totalQuestions Jumlah total pertanyaan
 * @returns Objek GradingResult berisi semua informasi penilaian
 */
export function performGrading(correctAnswers: number, totalQuestions: number): GradingResult {
  const numericScore = calculatePercentageScore(correctAnswers, totalQuestions);
  const letterGrade = convertScoreToGrade(numericScore);
  
  return {
    numericScore,
    letterGrade,
    correctAnswers,
    totalQuestions
  };
}