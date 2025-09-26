import React from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import AdminOrders from './Orders'
export default function AdminLayout(){
  return (<div className='p-6'><h1>Admin</h1><nav><Link to='orders'>Orders</Link></nav><Routes><Route path='orders' element={<AdminOrders/>} /></Routes></div>)
}
