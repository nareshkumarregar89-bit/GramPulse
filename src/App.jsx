import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './layouts/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewSurvey } from './pages/NewSurvey';
import { Families } from './pages/Families';
import { FamilyProfile } from './pages/FamilyProfile';
import { Mohallas } from './pages/Mohallas';
import { Castes } from './pages/Castes';
import { Search } from './pages/Search';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { DeletedRecords } from './pages/DeletedRecords';
import { ToastContainer } from './components/ToastContainer';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected App Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/survey" element={<NewSurvey />} />
                        <Route path="/survey/:id" element={<NewSurvey />} />
                        <Route path="/families" element={<Families />} />
                        <Route path="/families/:id" element={<FamilyProfile />} />
                        <Route path="/mohallas" element={<Mohallas />} />
                        <Route path="/castes" element={<Castes />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route
                          path="/deleted-records"
                          element={
                            <ProtectedRoute requireAdmin={true}>
                              <DeletedRecords />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute requireAdmin={true}>
                              <Settings />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <ToastContainer />
            <InstallPwaPrompt />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </DataProvider>
  );
}

export default App;
