import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './layouts/Layout';
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

function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <Router>
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
              <Route path="/deleted-records" element={<DeletedRecords />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
          <ToastContainer />
        </Router>
      </ToastProvider>
    </DataProvider>
  );
}

export default App;
