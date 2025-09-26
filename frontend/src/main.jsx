import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Catalog from './pages/Catalog'
import Order from './pages/Order'
import AdminLayout from './pages/admin/AdminLayout'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/login' element={<Login/>} />
      <Route path='/register' element={<Register/>} />
      <Route path='/catalog' element={<Catalog/>} />
      <Route path='/order/:id' element={<Order/>} />
      <Route path='/admin/*' element={<AdminLayout/>} />
    </Routes>
  </BrowserRouter>
)
