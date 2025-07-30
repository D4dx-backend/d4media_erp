import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import UserList from './UserList'
import UserForm from './UserForm'
import UserDetail from './UserDetail'
import UserProfile from './UserProfile'

const Users = () => {
  return (
    <div className="p-6">
      <Routes>
        <Route index element={<UserList />} />
        <Route path="new" element={<UserForm />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path=":id" element={<UserDetail />} />
        <Route path=":id/edit" element={<UserForm />} />
      </Routes>
    </div>
  )
}

export default Users