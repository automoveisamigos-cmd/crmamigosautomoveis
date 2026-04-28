/**
 * CRM Amigos Automóveis - Tracking Pixel (UTMify Style)
 * 
 * Instruções:
 * 1. Insira este script no <head> de todas as páginas do seu site/landing page.
 * 2. Ao enviar um formulário de lead, chame a função `window.crmTracker.getTrackingData()` 
 *    para obter os dados e enviá-los junto com o nome e whatsapp do cliente.
 */

(function() {
    const CRM_TRACKER_VERSION = '1.0.0';
    
    const crmTracker = {
        params: [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
            'fbclid', 'gclid', 'src', 'sck'
        ],

        init() {
            this.captureParams();
            this.saveReferrer();
            this.saveLandingPage();
        },

        captureParams() {
            const urlParams = new URLSearchParams(window.location.search);
            this.params.forEach(param => {
                const value = urlParams.get(param);
                if (value) {
                    localStorage.setItem(`crm_${param}`, value);
                    // Expira em 30 dias (opcional, aqui mantemos no localStorage)
                }
            });
        },

        saveReferrer() {
            if (document.referrer && !localStorage.getItem('crm_referrer')) {
                localStorage.setItem('crm_referrer', document.referrer);
            }
        },

        saveLandingPage() {
            if (!localStorage.getItem('crm_landing_page')) {
                localStorage.setItem('crm_landing_page', window.location.href.split('?')[0]);
            }
        },

        getTrackingData() {
            const data = {};
            this.params.forEach(param => {
                data[param] = localStorage.getItem(`crm_${param}`) || '';
            });
            data['referrer'] = localStorage.getItem('crm_referrer') || '';
            data['landing_page'] = localStorage.getItem('crm_landing_page') || '';
            return data;
        },

        // Função utilitária para enviar lead com rastreio
        async sendLead(apiUrl, leadData) {
            const tracking = this.getTrackingData();
            const payload = { ...leadData, ...tracking };
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                return await response.json();
            } catch (error) {
                console.error('Erro ao enviar lead para o CRM:', error);
                throw error;
            }
        }
    };

    window.crmTracker = crmTracker;
    crmTracker.init();
    console.log(`CRM Tracker ${CRM_TRACKER_VERSION} ativo.`);
})();
