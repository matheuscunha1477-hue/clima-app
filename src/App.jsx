import { useState } from 'react'
import './App.css'

function App() {
  const [cidade, setCidade] = useState('')
  const [clima, setClima] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const buscarClima = async () => {
    if (!cidade) return
    setLoading(true)
    setErro('')
    setClima(null)
    try {
      // 1. Pega lat/lon da cidade
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cidade}&count=1&language=pt&format=json`)
      const geoData = await geoRes.json()
      if (!geoData.results) throw new Error('Cidade não encontrada')
      
      const { latitude, longitude, name, country } = geoData.results[0]

      // 2. Pega clima
      const climaRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`)
      const climaData = await climaRes.json()

      setClima({ ...climaData.current, name, country })
    } catch {
      setErro('Cidade não encontrada! Tenta "Rio do Sul", "Blumenau", "São Paulo"')
    }
    setLoading(false)
  }

  const getEmoji = (code) => {
    if (code <= 1) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '❄️'
    return '⛈️'
  }

  return (
    <div className="container">
      <h1>☀️ Clima App - Tempo Real</h1>
      <p>Digite qualquer cidade do Brasil</p>

      <div className="search">
        <input
          placeholder="Ex: Rio do Sul, Lontras, Blumenau"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarClima()}
        />
        <button onClick={buscarClima}>Buscar</button>
      </div>

      {loading && <p className="loading">Buscando...</p>}
      {erro && <p className="error">{erro}</p>}

      {clima && (
        <div className="card">
          <div className="emoji">{getEmoji(clima.weather_code)}</div>
          <h2>{clima.name}, {clima.country}</h2>
          <h1 className="temp">{clima.temperature_2m}°C</h1>
          <div className="info">
            <p><b>💨 Vento:</b> {clima.wind_speed_10m} km/h</p>
            <p><b>🕒 Horário:</b> {new Date(clima.time).toLocaleTimeString()}</p>
            <p><b>🌡️ Sensação:</b> Tempo {clima.weather_code <= 3 ? 'limpo' : 'fechado'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App