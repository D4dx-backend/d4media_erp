import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DepartmentList from './DepartmentList';
import DepartmentForm from './DepartmentForm';
import DepartmentDetail from './DepartmentDetail';

const Departments = () => {
  return (
    <Routes>
      <Route index element={<DepartmentList />} />
      <Route path="new" element={<DepartmentForm />} />
      <Route path=":id" element={<DepartmentDetail />} />
      <Route path=":id/edit" element={<DepartmentForm />} />
    </Routes>
  );
};

export default Departments;