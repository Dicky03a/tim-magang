
export type Role = 'ADMIN' | 'STUDENT';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  class_id?: string;
  semester_id?: string;
  class?: { name: string };
  semester?: { name: string };
}

export interface TaskCategory {
  id: string;
  name: string;
}

export interface Semester {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  category_id: string;
  course_id: string;
  semester_id: string;
  class_id: string;
  deadline: string;
  question_count: number;
  is_published: boolean;
  created_at: string;
  category?: TaskCategory;
  course?: Course;
  semester?: Semester;
  class?: Class;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number;
  submitted_at: string;
  student?: Profile;
  assignment?: Assignment;
}

export interface Question {
  id: string;
  assignment_id: string;
  question_text: string;
  correct_option_id?: string; // Optional because we don't send this to client anymore
}

export interface AnswerOption {
  id: string;
  question_id: string;
  option_text: string;
}
