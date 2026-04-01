import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import ProjectDetail from './pages/ProjectDetail';
import CompanyDetail from './pages/CompanyDetail';

function App() {
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/company/:id" element={<CompanyDetail />} />
      </Routes>
    </div>
  );
}

export default App;