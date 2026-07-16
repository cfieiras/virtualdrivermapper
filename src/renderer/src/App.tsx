import { useEffect, useState } from 'react'

export default function App() {
  const [drives, setDrives] = useState<any[]>([])
  const [takenLetters, setTakenLetters] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [autostart, setAutostart] = useState(false)

  const [form, setForm] = useState({ letter: 'Z:', target: '', name: 'Unidad Local' })

  const loadDrives = async () => {
    setLoading(true)
    const data = await window.api.getDrives()
    const taken = await window.api.getTakenLetters()
    const auto = await window.api.getAutostart()
    setAutostart(auto)
    setTakenLetters(taken)
    setDrives(data)
    setLoading(false)
  }

  useEffect(() => {
    loadDrives()
  }, [])

  const handleMap = async () => {
    if (!form.letter || !form.target) return
    const res = await window.api.mapDrive(form)
    if (res.success) {
      setIsModalOpen(false)
      loadDrives()
    } else {
      alert(`Error al mapear: ${res.error}`)
    }
  }

  const handleUnmap = async (letter: string) => {
    const res = await window.api.unmapDrive(letter)
    if (res.success) {
      loadDrives()
    } else {
      alert(`Error al desmapear: ${res.error}`)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const toggleAutostart = async () => {
    const newVal = !autostart
    const finalVal = await window.api.setAutostart(newVal)
    setAutostart(finalVal)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
              Virtual Drive Mapper
            </h1>
            <p className="text-slate-400 mt-1">Gestiona tus unidades mapeadas persistentes.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAutostart}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <div className={`w-10 h-5 rounded-full relative transition-colors ${autostart ? 'bg-blue-500' : 'bg-slate-600'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${autostart ? 'translate-x-5' : ''}`}></div>
              </div>
              Auto-Inicio: {autostart ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                const availableLetter = 'ZYXWVUTSRQPONMLKJIHGFEDCBA'.split('').find(l => !takenLetters.includes(`${l}:`)) || 'Z'
                setForm({ ...form, letter: `${availableLetter}:` })
                setIsModalOpen(true)
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/25"
            >
              + Nueva Unidad
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && <p className="text-slate-400">Cargando...</p>}
          {!loading && drives.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-12">
              No tienes ninguna unidad mapeada aún.
            </p>
          )}
          {drives.map((drive) => (
            <div
              key={drive.letter}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-inner ${drive.isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                    {drive.letter}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{drive.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${drive.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {drive.isActive ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-slate-400 truncate" title={drive.target}>
                  <span className="font-semibold">Ruta:</span> {drive.target}
                </p>
                {drive.space && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Espacio Disponible</span>
                      <span>{formatBytes(drive.space.free)} libre</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-teal-400 h-1.5 rounded-full"
                        style={{ width: `${(1 - drive.space.free / drive.space.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!drive.isActive && (
                   <button
                   onClick={() => window.api.mapDrive(drive).then(loadDrives)}
                   className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg transition-colors"
                 >
                   Reconectar
                 </button>
                )}
                <button
                  onClick={() => handleUnmap(drive.letter)}
                  className="flex-1 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 text-sm rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
              <h2 className="text-xl font-bold mb-4">Mapear Nueva Unidad</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Letra de Unidad</label>
                  <select
                    value={form.letter}
                    onChange={(e) => setForm({ ...form, letter: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {'ZYXWVUTSRQPONMLKJIHGFEDCBA'.split('').map(l => {
                      const lStr = `${l}:`
                      const isTaken = takenLetters.includes(lStr)
                      return (
                        <option key={l} value={lStr} disabled={isTaken}>
                          {lStr} {isTaken ? '(Ocupada)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Ruta Destino</label>
                  <input
                    type="text"
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                    placeholder="Ej. C:\Users\TuUsuario\OneDrive"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nombre Descriptivo</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej. OneDrive Personal"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMap}
                  disabled={!form.letter || !form.target}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  Mapear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
