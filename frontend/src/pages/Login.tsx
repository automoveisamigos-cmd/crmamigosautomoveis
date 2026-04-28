import { useState } from 'react'
import axios from 'axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    try {
      const res = await axios.post(`http://${window.location.hostname}:3000/api/auth/login`, { email, senha })
      localStorage.setItem('token', res.data.token)
      window.location.href = '/'
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao fazer login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold text-white mb-6">CRM Amigos Automóveis</h1>
        {erro && <p className="text-red-500 mb-4">{erro}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold">
          Entrar
        </button>
      </form>
    </div>
  )
}