# Deploy a Vercel - Guia

## 1. Preparar el proyecto

```bash
# Inicializar git (si no esta hecho)
cd mini-tienda
git init
git add .
git commit -m "Initial commit"

# Crear repo en GitHub
gh repo create grana3d-tienda --public --source=. --remote=origin --push
```

## 2. Deploy en Vercel

### Opcion A: Desde la web
1. Ir a https://vercel.com/new
2. Importar el repo `grana3d-tienda`
3. Framework: Next.js (auto-detect)
4. Configurar variables de entorno

### Opcion B: CLI
```bash
npm i -g vercel
vercel login
vercel
```

## 3. Variables de entorno (Vercel Dashboard)

Ir a Settings > Environment Variables y agregar:

```
OPENAI_API_KEY=sk-proj-...
MP_ACCESS_TOKEN=APP_USR-...
NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app

FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@grana3d-acb66.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_ID=your_whatsapp_phone_id
ADMIN_WHATSAPP_PHONE=5491126354636
```

**Importante:** `FIREBASE_PRIVATE_KEY` debe ir con `\n` en lugar de saltos de linea reales.

## 4. Configurar Mercado Pago Webhook

1. Ir a https://www.mercadopago.com.ar/developers/panel
2. Tu aplicacion > Webhooks
3. URL: `https://tu-dominio.vercel.app/api/webhook`
4. Eventos: `payment`

## 5. Firestore Rules (produccion)

Ir a Firebase Console > Firestore > Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: public read, admin write
    match /products/{id} {
      allow read: if true;
      allow write: if false; // Solo desde API
    }
    
    // Orders: public read for tracking, admin write
    match /orders/{id} {
      allow read: if true;
      allow write: if false;
    }
    
    // Coupons: public read, admin write
    match /coupons/{id} {
      allow read: if true;
      allow write: if false;
    }
    
    // Customers: admin only
    match /customers/{id} {
      allow read, write: if false;
    }
    
    // Support tickets: public create, admin read
    match /support_tickets/{id} {
      allow read: if false;
      allow create: if true;
    }
  }
}
```

## 6. Dominio personalizado (opcional)

1. Vercel Dashboard > Settings > Domains
2. Agregar `grana3d.com` (o tu dominio)
3. Configurar DNS segun instrucciones de Vercel

## 7. Verificar deploy

- [ ] Landing page funciona: `/landing`
- [ ] Tienda funciona: `/tienda`
- [ ] Checkout redirige a Mercado Pago
- [ ] Webhook recibe pagos correctamente
- [ ] Tracking de pedidos funciona
- [ ] Admin panel accesible
- [ ] AI assistant responde

## Costos estimados

- **Vercel Hobby**: Gratis (hasta limites razonables)
- **Firebase Spark**: Gratis (50k lecturas/dia, 20k escrituras/dia)
- **WhatsApp Cloud API**: Gratis (1000 conversaciones/mes)
- **OpenAI**: ~$0.01-0.02 por consulta (GPT-4o-mini)
