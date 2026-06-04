"use client";
import React, { useState, useEffect } from 'react';
import { Settings, Code, Lock, Save, Trash2, Plus, Activity, Link as LinkIcon, Shield } from 'lucide-react';


export default function Dashboard() {
  const [appState, setAppState] = useState('loading'); // loading, setup, login, dashboard
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [rules, setRules] = useState([]);
  
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Nuevo estado para la regla temporal que se está escribiendo
  const [newRule, setNewRule] = useState({ url: '', event: 'Lead' });

  // Configuración de los eventos estándar de Facebook
  const fbEvents = [
    'Lead', 'CompleteRegistration', 'Purchase', 'AddToCart', 
    'InitiateCheckout', 'ViewContent', 'Contact', 'Subscribe'
  ];

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const res = await fetch('/api/auth/check', { cache: 'no-store' });
      const data = await res.json();
      
      if (!res.ok) {
        setAppState('error');
        setMessage({ type: 'error', text: data.error || 'Falta conectar la Base de Datos KV en Vercel.' });
        return;
      }

      if (data.needsSetup) {
        setAppState('setup');
      } else {
        setAppState('login');
      }
    } catch (error) {
      console.error('Error verificando setup', error);
      setAppState('error');
      setMessage({ type: 'error', text: 'Error conectando con el servidor' });
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    if (password.length < 4) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 4 caracteres' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: '¡Contraseña configurada con éxito!' });
        setTimeout(() => {
          setAppState('login');
          setPassword('');
          setConfirmPassword('');
          setMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al configurar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error conectando con el servidor' });
    }
    setLoading(false);
  };

  const fetchConfig = async (authPass) => {
    setLoading(true);
    try {
      const res = await fetch('/api/config', {
        headers: { 'Authorization': `Bearer ${authPass}` }
      });
      
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Contraseña incorrecta' });
        setLoading(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setPixelId(data.pixelId || '');
        setAccessToken(data.accessToken || '');
        setTestEventCode(data.testEventCode || '');
        setRules(data.rules || []);
        
        setPassword(authPass); // Guardar para futuras peticiones
        setAppState('dashboard');
        setMessage({ type: '', text: '' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al conectar con la API' });
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetchConfig(password);
  };

  const saveConfig = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({ pixelId, accessToken, testEventCode, rules })
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Error al guardar la configuración' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de red' });
    }
    setLoading(false);
  };

  const addRule = () => {
    if (newRule.url && newRule.event) {
      setRules([...rules, newRule]);
      setNewRule({ url: '', event: 'Lead' });
    }
  };

  const removeRule = (indexToRemove) => {
    const newRules = rules.filter((_, index) => index !== indexToRemove);
    setRules(newRules);
  };


  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="animate-pulse text-blue-600 font-semibold">Cargando CAPI...</div>
      </div>
    );
  }

  if (appState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 w-full max-w-md text-center">
          <Shield className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Error de Configuración</h1>
          <p className="text-gray-600 mb-4">{message.text}</p>
          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">Asegúrate de ir a Vercel &gt; Storage y crear una base de datos <b>KV (Redis)</b> vinculada a este proyecto.</p>
        </div>
      </div>
    );
  }

  if (appState === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-green-600 p-3 rounded-full mb-3">
              <Shield className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 text-center">Bienvenido</h1>
            <p className="text-gray-500 text-sm mt-1 text-center">Para proteger tu panel, crea una contraseña maestra. Solo se te pedirá una vez y será tu llave de acceso.</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Escribe tu contraseña"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Repite la contraseña"
                  required
                />
              </div>
            </div>
            {message.text && (
              <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message.text}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Guardando...' : 'Crear Contraseña y Continuar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (appState === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full mb-3">
              <Activity className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">CAPI Administrador</h1>
            <p className="text-gray-500 text-sm mt-1">Integración Meta & MailerLite</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Maestra</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Introduce tu contraseña"
                  required
                />
              </div>
            </div>
            {message.text && (
              <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message.text}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>
        </div>
      </div>
    );
  }


  // --- UI del Dashboard Principal ---
  const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';
  const scriptTag = `<script src="${currentDomain}/api/event-config"></script>`;

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-10">
      {/* Header tipo FB */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Activity className="text-blue-600 w-8 h-8" />
          <h1 className="text-xl font-bold text-gray-800">CAPI Administrador</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              setAppState('login');
              setPassword('');
            }} 
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-8 px-6 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium border-l-4 ${
                activeTab === 'settings' 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-transparent text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Configuración API</span>
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium border-l-4 ${
                activeTab === 'rules' 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-transparent text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LinkIcon className="w-5 h-5" />
              <span>Reglas de URL</span>
            </button>
            <button
              onClick={() => setActiveTab('script')}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium border-l-4 ${
                activeTab === 'script' 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-transparent text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Code className="w-5 h-5" />
              <span>Instalar Script</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
          
          {message.text && activeTab !== 'login' && (
            <div className={`mx-6 mt-6 p-4 rounded-md flex items-center space-x-2 ${
              message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* TAB: Settings */}
          {activeTab === 'settings' && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Configuración de Facebook CAPI</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID del Píxel de Facebook
                  </label>
                  <input
                    type="text"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej. 123456789012345"
                  />
                  <p className="mt-1 text-xs text-gray-500">El número identificador de tu Píxel.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token de Acceso (API de Conversiones)
                  </label>
                  <textarea
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Pega aquí el token largo generado en Facebook"
                  />
                  <p className="mt-1 text-xs text-gray-500">Lo encuentras en Configuración &gt; API de conversiones &gt; Generar token de acceso.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <span>Código de Prueba de Eventos (Opcional)</span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">Testing</span>
                  </label>
                  <input
                    type="text"
                    value={testEventCode}
                    onChange={(e) => setTestEventCode(e.target.value)}
                    className="w-full px-4 py-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 font-mono text-sm bg-yellow-50"
                    placeholder="Ej. TEST12345"
                  />
                  <p className="mt-1 text-xs text-gray-500">Úsalo para verificar eventos en la pestaña "Probar Eventos" de Facebook. <b>¡Bórralo cuando lances a producción!</b></p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={saveConfig}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Rules */}
          {activeTab === 'rules' && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Reglas de Eventos por URL</h2>
              <p className="text-gray-500 text-sm mb-6">
                Define qué evento de Facebook se debe disparar cuando un usuario visita una página específica de MailerLite.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Si la URL contiene:</label>
                  <input
                    type="text"
                    value={newRule.url}
                    onChange={(e) => setNewRule({ ...newRule, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Ej. /gracias-registro"
                  />
                </div>
                <div className="w-full md:w-48">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Disparar Evento:</label>
                  <select
                    value={newRule.event}
                    onChange={(e) => setNewRule({ ...newRule, event: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    {fbEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                </div>
                <button
                  onClick={addRule}
                  className="w-full md:w-auto flex items-center justify-center space-x-1 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir</span>
                </button>
              </div>

              {rules.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500">No has creado ninguna regla todavía.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL o Path</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento de FB</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rules.map((rule, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{rule.url}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {rule.event}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => removeRule(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={saveConfig}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Reglas</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: Script */}
          {activeTab === 'script' && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Instalación en MailerLite</h2>
              <p className="text-gray-500 text-sm mb-6">
                Copia y pega este script universal en el &lt;head&gt; de todas tus páginas de MailerLite. <b>Este único script hará 3 cosas por ti:</b> instalará el Píxel de Facebook automáticamente, generará un Event ID para deduplicación, y enviará el evento por la API (CAPI) a Facebook al mismo tiempo. ¡No instales el Píxel manualmente!
              </p>

              <div className="bg-gray-900 rounded-lg p-4 relative group">
                <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                  <code>{scriptTag}</code>
                </pre>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(scriptTag);
                    setMessage({ type: 'success', text: 'Script copiado al portapapeles' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
                  }}
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Copiar
                </button>
              </div>

              <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-yellow-800 mb-1">Paso a paso para MailerLite:</h3>
                <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                  <li>Copia el script superior.</li>
                  <li>Ve a MailerLite &gt; Sites &gt; Site Settings &gt; Analytics &amp; Custom Code.</li>
                  <li>Pega el script en la sección <b>Head</b>.</li>
                  <li>¡Listo! El script insertará el Píxel, generará un ID de deduplicación y enviará los eventos a la API automáticamente. Si ya tenías un Píxel de Facebook manual en MailerLite, ¡quítalo para evitar eventos duplicados!</li>
                </ol>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
