import React, {useState} from 'react'
import axios from 'axios'
export default function Register(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState('');
  async function submit(e){ e.preventDefault(); try{ const r=await axios.post('/api/auth/register',{email,password,name}); localStorage.setItem('token', r.data.token); alert('Registered'); }catch(e){ alert('Failed'); } }
  return (<div className='p-6'><h1>Register</h1><form onSubmit={submit}><input value={name} onChange={e=>setName(e.target.value)} placeholder='name' /><br/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder='email' /><br/><input value={password} onChange={e=>setPassword(e.target.value)} placeholder='password' type='password'/><br/><button>Register</button></form></div>)
}
