const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Inicializar Mercado Pago con la Variable de Entorno
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const client = new MercadoPagoConfig({
    accessToken: accessToken
});

// Endpoint para crear la preferencia de cobro
app.post('/api/create-preference', async (req, res) => {
    try {
        const { title, unit_price, quantity, currency_id, payer } = req.body;

        // Forzar protocolo HTTPS para despliegues en Vercel
        const host = req.get('host');
        const protocol = host.includes('localhost') ? req.protocol : 'https';
        const origin = `${protocol}://${host}`;

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

        const isTestToken = accessToken.startsWith('TEST-');
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

// Servir la página principal si se consulta por GET directamente a la API
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Para ejecución local
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo localmente en el puerto ${PORT}`);
    });
}

// LÍNEA CRÍTICA PARA VERCEL SERVERLESS:
module.exports = app;