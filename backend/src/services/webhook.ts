import dotenv from 'dotenv';
dotenv.config();

export const dispatchWebhook = async (event: string, payload: any) => {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.warn("N8N_WEBHOOK_URL não está configurada. Ignorando disparo de webhook.");
    return;
  }

  // Garantindo que 'score' e 'urgencia' estejam sempre no payload para o Agente de IA priorizar
  const enrichedPayload = {
    ...payload,
    score: payload.score ?? 0,
    urgencia: payload.urgencia ?? 'Normal',
    timestamp: new Date().toISOString(),
    event
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrichedPayload),
    });

    if (!response.ok) {
      console.error(`Falha no disparo do Webhook (${event}): Status ${response.status}`);
    } else {
      console.log(`Webhook disparado com sucesso para ${url} (Evento: ${event})`);
    }
  } catch (error) {
    console.error("Erro ao disparar webhook para n8n:", error);
  }
};
