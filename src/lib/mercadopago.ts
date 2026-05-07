import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export const mpPreference = new Preference(client);

export async function createPreference(
  items: { id: string; title: string; unitPrice: number; quantity: number }[], 
  backUrls: { success: string; pending: string; failure: string },
  externalReference?: string
) {
  const preferenceItems = items.map(item => ({
    id: item.id,
    title: item.title,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    currency_id: 'ARS',
  }));

  const response = await mpPreference.create({
    body: {
      items: preferenceItems,
      back_urls: backUrls,
      auto_return: 'approved',
      external_reference: externalReference,
      statement_descriptor: 'GRANA 3D',
      payer: {
        name: 'Cliente',
        email: 'ventas@grana3d.com.ar',
      },
    },
  });

  return response;
}
