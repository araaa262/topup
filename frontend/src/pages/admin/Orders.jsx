import React, {useEffect,useState} from 'react'
import axios from 'axios'
export default function AdminOrders(){
  const [items,setItems]=useState([])
  useEffect(()=>{ const token = localStorage.getItem('token'); axios.get('/api/admin/orders',{ headers: { Authorization: 'Bearer '+token } }).then(r=> setItems(r.data.data)).catch(console.error) },[])
  async function markPaid(id){
    const token = localStorage.getItem('token');
    await axios.post('/api/admin/orders/'+id+'/markPaid', { note: 'Paid via Telegram' }, { headers: { Authorization: 'Bearer '+token } });
    // refresh
    const r = await axios.get('/api/admin/orders',{ headers: { Authorization: 'Bearer '+token } });
    setItems(r.data.data);
  }
  return (<div className='p-6'><h2>Orders</h2><table border='1'><tbody>{items.map(o=>(<tr key={o.id}><td>{o.id}</td><td>{o.user_email}</td><td>{o.status}</td><td><button onClick={()=>markPaid(o.id)}>Mark Paid</button></td></tr>))}</tbody></table></div>)
}
