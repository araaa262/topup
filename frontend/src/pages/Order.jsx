import React, {useEffect,useState} from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
export default function Order(){
  const { id } = useParams()
  const [pkg,setPkg]=useState(null)
  const [player,setPlayer]=useState('')
  const [orderRes,setOrderRes]=useState(null)
  useEffect(()=>{
    // simplistic: fetch catalog then find package
    axios.get('/api/games').then(r=>{
      const all = r.data.data || []
      const found = all.find(x=> String(x.package_id) === String(id))
      setPkg(found)
    }).catch(console.error)
  },[id])
  async function create(){
    try{
      const token = localStorage.getItem('token')
      const r = await axios.post('/api/orders',{ package_id: id, player_id: player }, { headers: { Authorization: 'Bearer '+token } })
      setOrderRes(r.data)
    }catch(e){ alert('error') }
  }
  if(orderRes){
    const instr = orderRes.payment_instructions;
    return (
      <div className='p-6'>
        <h2>Instruksi Pembayaran Manual</h2>
        <p>{instr.text}</p>
        <p>Telegram: <a href={instr.telegram_url} target='_blank' rel='noopener noreferrer'>{instr.telegram_username}</a></p>
        <p>Status order: {orderRes.order.status}</p>
        <p>Tunggu verifikasi admin (akan otomatis diproses setelah admin menandai lunas).</p>
      </div>
    )
  }
  if(!pkg) return <div className='p-6'>Loading...</div>
  return <div className='p-6'><h1>Order {pkg.title}</h1><input value={player} onChange={e=>setPlayer(e.target.value)} placeholder='Player ID' /><br/><button onClick={create}>Buat Order & Lihat Instruksi Pembayaran</button></div>
}
