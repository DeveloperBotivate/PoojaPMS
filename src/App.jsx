import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import AddProject from './pages/AddProject/Add_Project';
import AllProject from './pages/AddProject/All_Project';
import ViewDesign from './pages/AddProject/UploadDesign/ViewDesign';
import ProjectMinors from './pages/AddProject/UploadDesign/ProjectMinors';
import ExecutionDetails from './pages/AddProject/UploadDesign/ExecutionDetails';
import ActualDetails from './pages/AddProject/UploadDesign/ActualDetails';
import AutoComparison from './pages/AddProject/UploadDesign/AutoComparison';
import ExcavationMurum from './pages/AddProject/UploadDesign/Excavation&Murum';
import AllReqMaterial from './pages/MaterialRequirement/Allreqmaterial';
import ProcessFlow from './pages/ProcessFlow/ProcessFlow';
import StageDetail from './pages/ProcessFlow/StageDetail';
import Mobilization from './pages/Mobilization/Mobilization';
import FinalizeConsultant from './pages/FinalizeConsultant/FinalizeConsultant';
import SentPO from './pages/SentPO/SentPO';
import Survey from './pages/Survey/Survey';
import DrawingUpload from './pages/DrawingUpload/DrawingUpload';
import FinalApproval from './pages/FinalApproval/FinalApproval';
import Settings from './pages/Settings/Settings';
import UploadDrawing from './pages/UploadDrawing/UploadDrawing';
import UploadDesignPage from './pages/UploadDesignPage/UploadDesignPage';

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
            <Route path="mobilization" element={<Mobilization />} />
            <Route path="finalize-consultant" element={<FinalizeConsultant />} />
            <Route path="sent-po" element={<SentPO />} />
            <Route path="survey" element={<Survey />} />
            <Route path="drawing-upload" element={<DrawingUpload />} />
            <Route path="final-approval" element={<FinalApproval />} />
            <Route path="upload-drawing" element={<UploadDrawing />} />
            <Route path="upload-design" element={<UploadDesignPage />} />
            <Route path="all-project" element={<AllProject />} />
            <Route path="project-minors/:projectNo" element={<ProjectMinors />} />
            <Route path="view-design/:projectNo" element={<ViewDesign />} />
            <Route path="execution-details/:projectNo" element={<ExecutionDetails />} />
            <Route path="actual-details/:projectNo" element={<ActualDetails />} />
            <Route path="auto-comparison/:projectNo" element={<AutoComparison />} />
            <Route path="excavation-murum/:projectNo" element={<ExcavationMurum />} />
            <Route path="process-flow/:projectNo" element={<ProcessFlow />} />
            <Route path="process-flow/:projectNo/:stageNumber" element={<StageDetail />} />
            <Route path="material-requirement" element={<AllReqMaterial />} />
            <Route path="material-requirement/:projectNo" element={<AllReqMaterial />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
