"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function IntegrationsPage() {
  const { user } = useAuth();
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
    const tenantId = user?.tenantId;
    if (!tenantId) {
      setMessage("Erro: Usuário não autenticado no Tenant corretamente.");
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
        tenantId: user?.tenantId,
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
    <div className="max-w-3xl mx-auto w-full">
      <Card>
        <CardHeader className="mb-6">
          <CardTitle className="text-2xl">Integrações</CardTitle>
          <CardDescription>Conecte canais de atendimento e outras plataformas ao seu Workspace.</CardDescription>
        </CardHeader>

        <div className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-[#4f46e5]/40 hover:bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-[#25D366] rounded-xl flex items-center justify-center text-2xl shadow-sm">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">WhatsApp Business</h3>
              <p className="text-sm text-gray-500">Fluxo Oficial Embedded Signup (Meta)</p>
            </div>
          </div>
          
          <Button
            onClick={handleConnectWhatsApp}
            disabled={!fbLoaded || loading}
            className="md:w-auto w-full bg-[#25D366] hover:bg-[#1DA851] text-white focus:ring-[#25D366]"
          >
            {loading ? "Conectando..." : "Conectar WhatsApp"}
          </Button>
        </div>

        {message && (
          <div className={`mt-6 px-4 py-3 rounded-lg text-sm font-medium border ${message.includes('❌') || message.includes('Falha') || message.includes('Por favor') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {message}
          </div>
        )}
      </Card>
    </div>
  );
}
