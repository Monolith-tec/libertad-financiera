import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Cargar variables de entorno desde '.env.local' o '.env'
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('.')); // Servir la landing page desde la carpeta raíz

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
    console.warn("⚠️ ADVERTENCIA: La variable MERCADOPAGO_ACCESS_TOKEN no está configurada en el entorno.");
} else {
    console.log("✅ Token de Mercado Pago detectado correctamente.");
}

// Inicializar cliente de Mercado Pago con la clave que viene de process.env.MERCADOPAGO_ACCESS_TOKEN
const client = new MercadoPagoConfig({
    accessToken: accessToken || ''
});

/**
 * Endpoint POST: /api/create-preference
 * Genera una preferencia de pago en Mercado Pago y retorna la URL de redirección (init_point)
 */
app.post('/api/create-preference', async (req, res) => {
    try {
        const { title, unit_price, quantity, currency_id, payer } = req.body;

        // Determinar el origen dinámico de la solicitud (protocolo y host local o servidor)
        const origin = `${req.protocol}://${req.get('host')}`;

        const preference = new Preference(client);

        const preferenceData = {
            body: {
                items: [
                    {
                        id: 'curso-libertad-financiera-2026',
                        title: title || 'El Camino Hacia la Libertad Financiera',
                        unit_price: Number(unit_price) || 20000,
                        quantity: Number(quantity) || 1,
                        currency_id: currency_id || 'MXN',
                        description: 'Acceso vitalicio al programa completo, cuadernos de trabajo, bootcamps y cumbres de inversión.'
                    }
                ],
                payer: {
                    name: payer?.name || 'Cliente',
                    email: payer?.email || 'cliente@ejemplo.com'
                },
                back_urls: {
                    success: `${origin}/?status=approved`,
                    failure: `${origin}/?status=failure`,
                    pending: `${origin}/?status=pending`
                },
                auto_return: 'approved',
                statement_descriptor: 'LIBERTAD FINANCIERA'
            }
        };

        const response = await preference.create(preferenceData);

        // Si el token es de prueba (TEST-), usa sandbox_init_point; si es de producción (APP_USR-), usa init_point.
        const isTestToken = accessToken?.startsWith('TEST-');
        const checkoutUrl = (isTestToken && response.sandbox_init_point) ? response.sandbox_init_point : response.init_point;

        res.json({
            id: response.id,
            init_point: checkoutUrl,
            sandbox_init_point: response.sandbox_init_point
        });
    } catch (error) {
        console.error('Error al generar la preferencia de Mercado Pago:', error);
        res.status(500).json({
            error: 'No se pudo crear la preferencia de pago',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});