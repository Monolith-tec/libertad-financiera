app.post('/api/create-preference', async (req, res) => {
    try {
        const { title, unit_price, quantity, currency_id, payer } = req.body;

        // Construcción segura de la URL base
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
                auto_return: 'approved',
                statement_descriptor: 'LIBERTAD FINANCIERA'
            }
        };

        const response = await preference.create(preferenceData);

        // Retornar checkout URL
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