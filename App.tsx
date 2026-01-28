import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase, getCurrentUser } from "./lib/supabase";
import { Profile } from "./types";

// Pages
import PublicHome from "./pages/PublicHome";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDataManagement from "./pages/AdminDataManagement";
import AdminAssignments from "./pages/AdminAssignments";
import AdminAssignmentEditor from "./pages/AdminAssignmentEditor";
import AdminSubmissions from "./pages/AdminSubmissions";
import AdminStudents from "./pages/AdminStudents";
import StudentDashboard from "./pages/StudentDashboard";
import AssignmentWorkspace from "./pages/AssignmentWorkspace";
import Layout from "./components/Layout";

const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const userProfile = await getCurrentUser();
      setProfile(userProfile as Profile);
      setLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const userProfile = await getCurrentUser();
        setProfile(userProfile as Profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route
          path="/login"
          element={
            !profile ? (
              <LoginPage />
            ) : (
              <Navigate
                to={profile.role === "ADMIN" ? "/admin" : "/student"}
                replace
              />
            )
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            profile?.role === "ADMIN" ? (
              <Layout profile={profile}>
                <AdminDashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/data"
          element={
            profile?.role === "ADMIN" ? (
              <Layout profile={profile}>
                <AdminDataManagement />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/assignments"
          element={
            profile?.role === "ADMIN" ? (
              <Layout profile={profile}>
                <AdminAssignments />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/assignments/:id"
          element={
            profile?.role === "ADMIN" ? (
              <Layout profile={profile}>
                <AdminAssignmentEditor />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/reports"
          element={
            profile?.role === "ADMIN" ? (
              <Layout profile={profile}>
                <AdminSubmissions />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/students"
          element={
            profile?.role === "ADMIN" ? (
              <Layout profile={profile}>
                <AdminStudents />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Student Protected Routes */}
        <Route
          path="/student"
          element={
            profile?.role === "STUDENT" ? (
              <Layout profile={profile}>
                <StudentDashboard profile={profile} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/assignment/:id"
          element={
            profile?.role === "STUDENT" ? (
              <AssignmentWorkspace profile={profile} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
