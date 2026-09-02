import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import AddProject from './pages/AddProject/Add_Project';
import AllProject from './pages/AddProject/All_Project';
import ViewDesign from './pages/AddProject/UploadDesign/ViewDesign';
import ExecutionDetails from './pages/AddProject/UploadDesign/ExecutionDetails';
import ActualDetails from './pages/AddProject/UploadDesign/ActualDetails';
import AutoComparison from './pages/AddProject/UploadDesign/AutoComparison';
import AllReqMaterial from './pages/MaterialRequirement/Allreqmaterial';

import ProtectedRoute from './components/ProtectedRoute';
import { initializeStorage } from './utils/storageManager';

function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/add-project" replace />} />
            <Route path="add-project" element={<AddProject />} />
            <Route path="all-project" element={<AllProject />} />
            <Route path="view-design/:projectNo" element={<ViewDesign />} />
            <Route path="execution-details/:projectNo" element={<ExecutionDetails />} />
            <Route path="actual-details/:projectNo" element={<ActualDetails />} />
            <Route path="auto-comparison/:projectNo" element={<AutoComparison />} />
            <Route path="material-requirement" element={<AllReqMaterial />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
