"use client";
import React, { useState, useEffect } from 'react';
import { Settings, Code, Lock, Save, Trash2, Plus, Facebook, Link as LinkIcon, Shield } from 'lucide-react';

export default function Dashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
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

  const fetchConfig = async (authPass) => {
    setLoading(true);
    try {
      const res = await fetch('/api/config', {
        headers: { 'Authorization': `Bearer ${authPass}` }
      });
      
      if (res.status === 401) {
        setIsAuthenticated(false);
        setMessage({ type: 'error', text: 'Contraseña incorrecta' });
        setLoading(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setPixelId(data.pixelId || '');
        setAccessToken(data.accessToken || '');
        setRules(data.rules || []);
        setIsAuthenticated(true);
        setPassword(authPass); // Guardar para futuras peticiones
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
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({ pixelId, accessToken, rules })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Error al guardar configuración' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de red' });
    }
    setLoading(false);
  };

  const addRule = () => {
    if (!newRule.url) return;
    setRules([...rules, newRule]);
    setNewRule({ url: '', event: 'Lead' });
  };

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  // --- UI del Login ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full mb-3">
              <Facebook className="text-white w-8 h-8" />
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
  const scriptCode = `<script>
// Script Universal CAPI MailerLite
document.addEventListener("DOMContentLoaded", function() {
    const apiEndpoint = "${currentDomain}/api/event-config?url=" + encodeURIComponent(window.location.href);
    
    // Ocultar campos visualmente
    const estilo = document.createElement('style');
    estilo.innerHTML = '.ml-field-event_id, .ml-field-event_name, input[name="fields[event_id]"], input[name="fields[event_name]"] { display: none !important; }';
    document.head.appendChild(estilo);

    // Obtener configuración del evento para esta URL
    fetch(apiEndpoint)
      .then(res => res.json())
      .then(data => {
          const uniqueEventId = 'ml_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          
          setTimeout(() => {
              const inputEventId = document.querySelector('input[name="fields[event_id]"]');
              const inputEventName = document.querySelector('input[name="fields[event_name]"]');
              
              if (inputEventId) inputEventId.value = uniqueEventId;
              if (inputEventName) inputEventName.value = data.eventName;
          }, 1500);

          if (typeof fbq === 'function') {
              fbq('track', data.eventName, {}, { eventID: uniqueEventId });
          }
      })
      .catch(err => console.error("Error cargando config CAPI", err));
});
</script>`;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      {/* Header tipo FB */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Facebook className="text-blue-600 w-8 h-8" />
          <h1 className="text-xl font-bold text-gray-800">CAPI Administrador</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 flex items-center"><Shield className="w-4 h-4 mr-1 text-green-500" /> Seguro</span>
          <button onClick={saveConfig} disabled={loading} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6 mt-4">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col space-y-1">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Orígenes de datos
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'rules' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <LinkIcon className="w-5 h-5 mr-3" />
            Reglas de URL
          </button>
          <button 
            onClick={() => setActiveTab('script')}
            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'script' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Code className="w-5 h-5 mr-3" />
            Script Universal
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          
          {message.text && (
            <div className={`mb-6 p-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Configuración de la API de Conversiones</h2>
                <p className="text-sm text-gray-500 mt-1">Introduce las credenciales de tu Administrador de Eventos de Meta.</p>
              </div>
              
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identificador del Píxel</label>
                  <input
                    type="text"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="Ej. 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token de Acceso (Access Token)</label>
                  <textarea
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    rows={4}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-mono text-sm"
                    placeholder="Pega aquí el token gigante que genera Facebook..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Configuración de Eventos por URL</h2>
                <p className="text-sm text-gray-500 mt-1">Define qué evento de Facebook se debe disparar dependiendo de la Landing Page que visite el usuario.</p>
              </div>

              {/* Añadir Nueva Regla */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Parte de la URL</label>
                  <input
                    type="text"
                    value={newRule.url}
                    onChange={(e) => setNewRule({...newRule, url: e.target.value})}
                    placeholder="ej. /registro-curso"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <div className="w-full md:w-48">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Evento a disparar</label>
                  <select
                    value={newRule.event}
                    onChange={(e) => setNewRule({...newRule, event: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {fbEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                </div>
                <button onClick={addRule} className="w-full md:w-auto bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition flex items-center justify-center font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Regla
                </button>
              </div>

              {/* Lista de Reglas */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Si la URL contiene...</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disparar Evento</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rules.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-400 text-sm">No hay reglas configuradas. Se disparará "Lead" por defecto en todas partes.</td>
                      </tr>
                    ) : rules.map((rule, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{rule.url}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rule.event}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => removeRule(index)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-md transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Script Universal</h2>
                <p className="text-sm text-gray-500 mt-1">Copia este código y pégalo en el <b>Custom Code</b> de MailerLite. ¡Solo necesitas pegarlo una vez y funcionará para todas tus reglas!</p>
              </div>
              
              <div className="relative">
                <div className="absolute top-0 right-0 p-3">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(scriptCode);
                      setMessage({ type: 'success', text: 'Script copiado al portapapeles' });
                      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                    }}
                    className="bg-gray-700 text-white text-xs px-3 py-1.5 rounded hover:bg-gray-800 transition"
                  >
                    Copiar Código
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed pt-12 shadow-inner border border-gray-800">
                  {scriptCode}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
