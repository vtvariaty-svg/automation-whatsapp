"use client";

import { useState, useEffect } from "react";

export default function IntegrationsPage() {
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fbLoaded, setFbLoaded] = useState(false);

  useEffect(() => {
    // Inject Facebook SDK
    if (document.getElementById('facebook-jssdk')) {
      setFbLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      // @ts-ignore
      if (window.FB) {
         // @ts-ignore
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FB_APP_ID || 'SEU_APP_ID_AQUI',
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v22.0'
        });
        setFbLoaded(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  const handleConnectWhatsApp = () => {
    if (!tenantId) {
      setMessage("Por favor, preencha o Tenant ID primeiro.");
      return;
    }

    setMessage("");
    // @ts-ignore
    if (!window.FB) {
      setMessage("SDK do Facebook não carregado.");
      return;
    }

    // @ts-ignore
    window.FB.login((response) => {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        
        // Em um fluxo Meta real de Embedded Signup, a Graph API deve retornar os dados abaixo
        // Aqui estamos mapeando pelo Graph API v22 endpoint simulado após o redirect
        // O escopo pedido foi para whatsapp_business_management
        fetchGraphData(accessToken);
      } else {
        setMessage("Autorização cancelada ou falhou.");
      }
    }, {
      config_id: process.env.NEXT_PUBLIC_FB_CONFIG_ID || 'SEU_CONFIG_ID', 
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {
          // Additional setup payload se necessário pela doc
        }
      }
    });
  };

  const fetchGraphData = async (accessToken: string) => {
    setLoading(true);
    setMessage("Buscando dados da conta vinculada...");
    
    // NOTA: Em app real, backend deveria usar o Token ou "code" para extrair os dados.
    // Como a Meta mudou fluxos com o Code (oauth), deixaremos o callback aceitar os campos para simularmos ou integrarmos de verdade.
    // Por simplicidade aqui, vamos simular que pegamos os IDs e já mandamos pro nosso endpoint de callback.
    
    try {
      // Neste MVP, vamos simular a extração do fluxo "Embedded Signup" onde a Meta nos daria WhatsApp Business Config 
      // Em produção, deve-se chamar a Graph API usando o accessToken retornado ou realizar server-side oauth.
      // Substitua pela chamada real Graph API "GET /debug_token" ou "GET /v22.0/me/accounts"
      const fakeWabaId = `waba_${Math.floor(Math.random() * 100000)}`;
      const fakePhoneId = `phone_${Math.floor(Math.random() * 100000)}`;
      
      const payload = {
        tenantId,
        business_account_id: fakeWabaId, // Replace com GraphData WABA ID Real
        phone_number_id: fakePhoneId, // Replace com GraphData Phone ID Real
        access_token: accessToken
      };

      const res = await fetch("/api/integrations/whatsapp/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage("✅ WhatsApp conectado com sucesso!");
      } else {
        const err = await res.json();
        setMessage("❌ Falha ao salvar: " + err.error);
      }
    } catch (e: any) {
      setMessage("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Integrações</h1>
        <p className="text-gray-500 mb-8">Conecte canais de atendimento e outras plataformas ao seu Tenant.</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Seu Tenant ID (Temporário para contexto)</label>
          <input 
            type="text" 
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="Cole seu Tenant UUID"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="border border-gray-200 rounded-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl">
              <i className="fab fa-whatsapp"></i> {/* Use whatever icon */}
              📱
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">WhatsApp Business</h3>
              <p className="text-sm text-gray-500">Fluxo Oficial Embedded Signup (Meta)</p>
            </div>
          </div>
          
          <button
            onClick={handleConnectWhatsApp}
            disabled={!fbLoaded || loading}
            className="bg-[#25D366] hover:bg-[#1DA851] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm"
          >
            {loading ? "Conectando..." : "Conectar WhatsApp"}
          </button>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-lg text-sm font-medium ${message.includes('❌') || message.includes('Falha') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
