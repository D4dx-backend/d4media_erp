import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InvoiceList from '../../components/invoices/InvoiceList';
import InvoiceDetail from '../../components/invoices/InvoiceDetail';
import InvoiceForm from '../../components/invoices/InvoiceForm';

const Invoices = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <Routes>
        <Route path="/" element={<InvoiceList />} />
        <Route path="/new" element={<InvoiceForm />} />
        <Route path="/:id" element={<InvoiceDetail />} />
        <Route path="/:id/edit" element={<InvoiceForm />} />
      </Routes>
    </div>
  );
};

export default Invoices;