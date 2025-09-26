import React, {useState} from 'react'
import axios from 'axios'
export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  async function submit(e){ e.preventDefault(); try{ const r=await axios.post('/api/auth/login',{email,password}); localStorage.setItem('token', r.data.token); alert('Logged in'); }catch(e){ alert('Failed'); } }
  return (<div className='p-6'><h1>Login</h1><form onSubmit={submit}><input value={email} onChange={e=>setEmail(e.target.value)} placeholder='email' /><br/><input value={password} onChange={e=>setPassword(e.target.value)} placeholder='password' type='password'/><br/><button>Login</button></form></div>)
}
