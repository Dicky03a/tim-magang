import React, { useState } from 'react';
import { performGrading, convertScoreToGrade, getGradeColorClass } from '../lib/grading';

const GradingDemo: React.FC = () => {
  const [correctAnswers, setCorrectAnswers] = useState(8);
  const [totalQuestions, setTotalQuestions] = useState(10);

  const gradingResult = performGrading(correctAnswers, totalQuestions);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Demo Sistem Penilaian</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah Jawaban Benar
          </label>
          <input
            type="number"
            min="0"
            max={totalQuestions}
            value={correctAnswers}
            onChange={(e) => setCorrectAnswers(Math.min(parseInt(e.target.value) || 0, totalQuestions))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah Total Soal
          </label>
          <input
            type="number"
            min="1"
            value={totalQuestions}
            onChange={(e) => {
              const newTotal = parseInt(e.target.value) || 1;
              setTotalQuestions(newTotal);
              setCorrectAnswers(Math.min(correctAnswers, newTotal));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Hasil Penilaian:</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-600 font-medium">Jawaban Benar</p>
            <p className="text-2xl font-bold text-blue-800">{gradingResult.correctAnswers}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-green-600 font-medium">Skor Numerik</p>
            <p className="text-2xl font-bold text-green-800">{gradingResult.numericScore}%</p>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${getGradeColorClass(gradingResult.letterGrade)}`}>
            <p className="text-sm font-medium uppercase tracking-wider">Nilai Huruf</p>
            <p className="text-2xl font-bold">{gradingResult.letterGrade}</p>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-700 mb-2">Rentang Nilai:</h4>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>
              A (90-100%)
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
              A- (85-89%)
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              B+ (80-84%)
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></span>
              B (75-79%)
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-teal-500 mr-2"></span>
              B- (70-74%)
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
              C+ (65-69%)
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              C (60-64%)
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
              C- (55-59%)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GradingDemo;