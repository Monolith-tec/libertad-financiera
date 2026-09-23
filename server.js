import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

const client = new MercadoPagoConfig({
    accessToken: accessToken
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/create-preference', async (req, res) => {
    try {
        const { title, unit_price, quantity, currency_id, payer } = req.body;

        const host = req.get('host') || 'libertad-financiera-beta.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
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
                    success: `${origin}/`,
                    failure: `${origin}/`,
                    pending: `${origin}/`
                },
                statement_descriptor: 'LIBERTAD FINANCIERA'
            }
        };

        const response = await preference.create(preferenceData);

        const checkoutUrl = response.init_point || response.sandbox_init_point;

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

export default app;