import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    axios.get(`http://${window.location.hostname}:3000/api/leads`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setLeads(res.data)).catch(() => {})
  }, [])

  const leadsFiltrados = leads.filter(l => 
    l.nome?.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Leads</h1>
      <input
        type="text"
        placeholder="Buscar..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        className="w-full p-3 mb-6 bg-gray-800 text-white rounded"
      />
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-white">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">Telefone</th>
              <th className="p-4 text-left">Score</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {leadsFiltrados.map(l => (
              <tr key={l.id} className="border-t border-gray-700">
                <td className="p-4">{l.nome}</td>
                <td className="p-4">{l.telefone}</td>
                <td className="p-4">{l.score}</td>
                <td className="p-4">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}