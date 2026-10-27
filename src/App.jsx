import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [cidade, setCidade] = useState('')
  const [clima, setClima] = useState(null)
  const [previsao, setPrevisao] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [usandoLocal, setUsandoLocal] = useState(false)

  const buscarPorCoords = async (lat, lon, nomeCidade = null) => {
    setLoading(true)
    setErro('')
    try {
      const climaRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`)
      const climaData = await climaRes.json()
      
      let displayName = nomeCidade
      if (!displayName) {
        // tenta descobrir nome da cidade pelas coords
        const revGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=pt`)
        const revData = await revGeo.json()
        displayName = revData.results?.[0]?.name || "Sua Localização"
      }

      setClima({ ...climaData.current, name: displayName, country: 'BR', latitude: lat, longitude: lon })
      setPrevisao(climaData.daily)
    } catch {
      setErro('Não consegui pegar o clima dessa localização')
    }
    setLoading(false)
  }

  const buscarClima = async (cidadeForcada = null) => {
    const cidadeBusca = cidadeForcada || cidade
    if (!cidadeBusca) return
    setLoading(true)
    setErro('')
    setClima(null)
    setPrevisao(null)
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cidadeBusca}&count=1&language=pt&format=json`)
      const geoData = await geoRes.json()
      if (!geoData.results) throw new Error('Cidade não encontrada')
      const { latitude, longitude, name } = geoData.results[0]
      await buscarPorCoords(latitude, longitude, name)
      setCidade('')
    } catch {
      setErro('Cidade não encontrada! Tenta "Lontras", "Blumenau", "São Paulo"')
      setLoading(false)
    }
  }

  // 1. GEOLOCALIZAÇÃO AUTOMÁTICA
  useEffect(() => {
    if (navigator.geolocation) {
      setUsandoLocal(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          buscarPorCoords(pos.coords.latitude, pos.coords.longitude)
          setUsandoLocal(false)
        },
        () => {
          // se negar, carrega Lontras padrão
          buscarPorCoords(-27.1666, -49.9, "Lontras")
          setUsandoLocal(false)
        }
      )
    } else {
      buscarPorCoords(-27.1666, -49.9, "Lontras")
    }
  }, [])

  const getEmoji = (code) => {
    if (code <= 1) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '❄️'
    return '⛈️'
  }

  const getDia = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  }

  return (
    <div className="container">
      <h1>☀️ Clima App - Tempo Real</h1>
      <p>{usandoLocal ? "📍 Detectando sua localização..." : "Digite qualquer cidade do Brasil"}</p>

      <div className="search">
        <input
          placeholder="Ex: Lontras, Rio do Sul"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarClima()}
        />
        <button onClick={() => buscarClima()}>Buscar</button>
      </div>

      <button className="geo-btn" onClick={() => {
        if(navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(p => buscarPorCoords(p.coords.latitude, p.coords.longitude))
        }
      }}>📍 Usar minha localização</button>

      {loading && <p className="loading">Buscando...</p>}
      {erro && <p className="error">{erro}</p>}

      {clima && (
        <>
          <div className="card">
            <div className="emoji">{getEmoji(clima.weather_code)}</div>
            <h2>{clima.name}</h2>
            <h1 className="temp">{Math.round(clima.temperature_2m)}°C</h1>
            <div className="info">
              <p><b>🌡️ Sensação:</b> {Math.round(clima.apparent_temperature)}°C</p>
              <p><b>💧 Umidade:</b> {clima.relative_humidity_2m}%</p>
              <p><b>💨 Vento:</b> {clima.wind_speed_10m} km/h</p>
            </div>
          </div>

          {/* 2. PREVISÃO 7 DIAS */}
          {previsao && (
            <div className="forecast">
              <h3>Próximos 7 dias</h3>
              <div className="forecast-list">
                {previsao.time.map((dia, i) => (
                  <div key={dia} className="forecast-day">
                    <span>{getDia(dia)}</span>
                    <span>{getEmoji(previsao.weather_code[i])}</span>
                    <span><b>{Math.round(previsao.temperature_2m_max[i])}°</b> / {Math.round(previsao.temperature_2m_min[i])}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <p style={{marginTop: 20, fontSize: 12, opacity: 0.6}}>Dica: No celular, clica em Compartilhar > Adicionar à Tela de Início 📲</p>
    </div>
  )
}

export default App