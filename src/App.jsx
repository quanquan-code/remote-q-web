import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import ProjectDetail from './pages/ProjectDetail';
import CompanyDetail from './pages/CompanyDetail';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Showcase from './pages/Showcase';
import Admin from './pages/Admin';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        <Route path="/" element={<Jobs />} />
        <Route path="/search" element={<Search />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/company/:id" element={<CompanyDetail />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/showcase" element={<Showcase />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

export default App;// trigger redeploy 1779519769
