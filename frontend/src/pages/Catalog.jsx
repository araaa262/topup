import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
export default function Catalog(){
  const [items, setItems] = useState([])
  useEffect(()=>{
    axios.get('/api/games').then(r=> setItems(r.data.data)).catch(console.error)
  },[])
  return (
    <div className='p-6'>
      <h1 className='text-2xl mb-4'>Catalog</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {items.map(i=> (
          <div key={i.package_id} className='border p-4 rounded'>
            <h3 className='font-bold'>{i.game_name} - {i.title}</h3>
            <p>Price: Rp {i.price_idr}</p>
            <Link to={'/order/' + i.package_id} className='mt-2 inline-block'>Order</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
