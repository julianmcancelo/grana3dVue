import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const clientId = process.env.ML_CLIENT_ID;
    const clientSecret = process.env.ML_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Credenciales de ML no configuradas' }, { status: 500 });
    }

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: 'https://www.grana3d.com.ar',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Error al obtener token' }, { status: response.status });
    }

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (error: any) {
    console.error('ML token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
