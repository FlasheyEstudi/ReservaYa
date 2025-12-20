/**
 * Pagadito Payment Gateway Integration
 * 
 * Servicio wrapper para la API de Pagadito (APIPG)
 * Documentación: https://dev.pagadito.com
 * 
 * CONFIGURACIÓN:
 * 1. Crea cuenta comercial en https://comercios.pagadito.com
 * 2. Obtén UID y WSK en Panel -> Configuración Técnica -> Parámetros de Integración
 * 3. Configura las variables de entorno
 */

interface PagaditoConfig {
    uid: string;
    wsk: string;
    mode: 'sandbox' | 'live';
    returnUrl: string;
}

interface PaymentDetail {
    quantity: number;
    description: string;
    price: number;
}

interface PaymentResponse {
    success: boolean;
    redirectUrl?: string;
    transactionId?: string;
    error?: string;
}

interface StatusResponse {
    success: boolean;
    status?: 'completed' | 'pending' | 'failed' | 'cancelled';
    amount?: number;
    date?: string;
    error?: string;
}

// API URLs
const API_URLS = {
    sandbox: 'https://sandbox.pagadito.com/comercios/apipg/charges.php',
    live: 'https://comercios.pagadito.com/apipg/charges.php'
};

class PagaditoService {
    private config: PagaditoConfig;
    private sessionToken: string | null = null;

    constructor() {
        this.config = {
            uid: process.env.PAGADITO_UID || '',
            wsk: process.env.PAGADITO_WSK || '',
            mode: (process.env.PAGADITO_MODE || 'sandbox') as 'sandbox' | 'live',
            returnUrl: process.env.PAGADITO_RETURN_URL || 'http://localhost:3000/api/billing/callback'
        };
    }

    /**
     * Verifica si Pagadito está configurado
     */
    isConfigured(): boolean {
        return !!(this.config.uid && this.config.wsk);
    }

    /**
     * Obtiene la URL base según el modo
     */
    private getApiUrl(): string {
        return API_URLS[this.config.mode];
    }

    /**
     * Conecta con Pagadito API y obtiene token de sesión
     */
    async connect(): Promise<boolean> {
        if (!this.isConfigured()) {
            console.log('[Pagadito] ⚠️ No configurado - usando modo simulación');
            return false;
        }

        try {
            const response = await fetch(this.getApiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    operation: 'f0f42b01ab1a5e3e',  // connect operation code
                    uid: this.config.uid,
                    wsk: this.config.wsk,
                    format_return: 'json'
                })
            });

            const data = await response.json();

            if (data.code === 'PG1001') {  // Connection successful
                this.sessionToken = data.value;
                console.log('[Pagadito] ✅ Conectado exitosamente');
                return true;
            } else {
                console.error('[Pagadito] ❌ Error de conexión:', data.message);
                return false;
            }
        } catch (error) {
            console.error('[Pagadito] ❌ Error de red:', error);
            return false;
        }
    }

    /**
     * Crea un pago y retorna URL de redirección a Pagadito
     */
    async createPayment(
        ern: string,  // External Reference Number (tu ID de orden/suscripción)
        details: PaymentDetail[],
        currency: string = 'USD'
    ): Promise<PaymentResponse> {
        // Si no está configurado, simular para desarrollo
        if (!this.isConfigured()) {
            console.log('[Pagadito] 🔧 Modo simulación - Creando pago ficticio');
            const total = details.reduce((sum, d) => sum + (d.quantity * d.price), 0);

            return {
                success: true,
                redirectUrl: `/manage/subscription?payment=simulated&amount=${total}&ern=${ern}`,
                transactionId: `SIM-${Date.now()}`
            };
        }

        // Conectar si no hay sesión
        if (!this.sessionToken) {
            const connected = await this.connect();
            if (!connected) {
                return { success: false, error: 'No se pudo conectar con Pagadito' };
            }
        }

        try {
            // Agregar detalles del pago
            for (const detail of details) {
                await fetch(this.getApiUrl(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        operation: 'f0f42b01ab1a5e3e',  // add_detail operation
                        token: this.sessionToken!,
                        quantity: detail.quantity.toString(),
                        description: detail.description,
                        price: detail.price.toString(),
                        format_return: 'json'
                    })
                });
            }

            // Ejecutar transacción
            const response = await fetch(this.getApiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    operation: 'f0f42b01ab1a5e3e',  // exec_trans operation
                    token: this.sessionToken!,
                    ern: ern,
                    currency: currency,
                    format_return: 'json',
                    custom_param: JSON.stringify({ subscriptionId: ern })
                })
            });

            const data = await response.json();

            if (data.code === 'PG1002') {  // Transaction created
                return {
                    success: true,
                    redirectUrl: data.value,  // URL de Pagadito para pago
                    transactionId: data.token
                };
            } else {
                return {
                    success: false,
                    error: data.message || 'Error creando transacción'
                };
            }
        } catch (error) {
            console.error('[Pagadito] ❌ Error creando pago:', error);
            return { success: false, error: 'Error de conexión con Pagadito' };
        }
    }

    /**
     * Verifica el estado de un pago
     */
    async getPaymentStatus(token: string): Promise<StatusResponse> {
        if (!this.isConfigured()) {
            // Modo simulación - siempre retorna éxito
            return {
                success: true,
                status: 'completed',
                amount: 29.00,
                date: new Date().toISOString()
            };
        }

        if (!this.sessionToken) {
            await this.connect();
        }

        try {
            const response = await fetch(this.getApiUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    operation: 'f0f42b01ab1a5e3e',  // get_status operation
                    token: this.sessionToken!,
                    token_trans: token,
                    format_return: 'json'
                })
            });

            const data = await response.json();

            if (data.code === 'PG1003') {  // Status retrieved
                const statusMap: Record<string, StatusResponse['status']> = {
                    'COMPLETED': 'completed',
                    'PENDING': 'pending',
                    'FAILED': 'failed',
                    'CANCELLED': 'cancelled'
                };

                return {
                    success: true,
                    status: statusMap[data.status] || 'pending',
                    amount: parseFloat(data.amount || '0'),
                    date: data.date
                };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('[Pagadito] ❌ Error verificando estado:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
}

// Singleton instance
export const pagadito = new PagaditoService();

// Export types
export type { PaymentDetail, PaymentResponse, StatusResponse };
