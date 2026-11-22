# Ikigai 生

Tus finanzas (Quincena) y tu entreno en una sola app que **funciona sin internet** y se **sincroniza sola** con tu Supabase cuando vuelve la conexión.

| Versión | Dónde se obtiene |
|---|---|
| Windows 11 (`.exe`) | Pestaña **Releases** de este repositorio |
| Android (`.apk`) | Pestaña **Releases** de este repositorio |
| Web (plan B) | `https://keevinruizz21-collab.github.io/ikigai/` |

## Cómo funciona

- **Sin internet:** cada dispositivo guarda una copia completa de tus datos, **cifrada con tu frase** (AES-256-GCM, clave derivada con PBKDF2 de 600.000 iteraciones). Registras y chuleas normal.
- **Con internet:** sube lo pendiente y trae lo del otro dispositivo, de forma automática (cada minuto, al volver la señal y al instante con tiempo real). Si dos dispositivos cambian cosas distintas sin conexión, se juntan; si cambian el mismo registro, gana el último cambio.
- **Respaldos:** automáticos cada 15 días (o 20) y manuales con el botón 生. Van cifrados y comprimidos. Se conservan los últimos 6 automáticos, 1 por mes durante 12 meses, 1 por año para siempre y los últimos 10 manuales; los marcados ★ nunca se borran. En Windows y Android también quedan en `Documentos/Ikigai/Respaldos`.

## Seguridad

1. **Cuenta:** correo, contraseña y doble factor obligatorio (Google Authenticator). La base de datos rechaza cualquier sesión sin el segundo factor.
2. **Base de datos:** reglas por fila: cada usuario solo puede leer y escribir lo suyo. La clave pública de `web/ikigai/config.js` sola no da acceso a nada.
3. **Dispositivo:** datos y sesión cifrados con tu frase; se bloquea sola tras unos minutos sin uso.
4. **Código:** todo va empaquetado (sin scripts de terceros en línea) y con una política de seguridad de contenido (CSP) estricta.
5. **Nunca** pongas en el código la clave `secret` ni la `service_role` de Supabase.

## Configuración inicial (una sola vez)

### 1. Supabase
1. **SQL Editor → New query**: pega todo `supabase/schema.sql` y ejecútalo (**Run**).
2. **Authentication → Sign In / Providers**: desactiva **Allow new users to sign up** (nadie más puede crear cuenta).
3. **Authentication → Users → Add user → Create new user**: tu correo y una contraseña larga, con **Auto Confirm User** marcado.

### 2. GitHub
1. **Settings → Pages → Build and deployment → Source: GitHub Actions** (publica la versión web).
2. **Settings → Secrets and variables → Actions → New repository secret**: nombre `IKIGAI_ANDROID_KEY`, valor: la clave de firma de Android que te entregó Claude. Sin ella, el APK sale firmado con una llave temporal.

### 3. Primer uso
1. Instala la app y entra con tu correo y contraseña.
2. Escanea el código QR con Google Authenticator y escribe el código.
3. Crea tu **frase** (la misma en todos tus dispositivos). **No se puede recuperar.**
4. En el primer dispositivo: botón **生 → Importar archivo de Quincena** con el archivo `organizador-datos-….json`. Después borra ese archivo.

## Para desarrolladores

- `tools/build_web.py [organizador-codigo.json]`: arma `web/` a partir del código de Quincena (`source/`).
- Publicar una versión: crear una etiqueta `vX.Y.Z` → **Compilar Windows y Android** genera el `.exe` y el `.apk` en Releases.
- **Mantener Supabase activo:** un latido cada 3 días evita que el plan gratis pause el proyecto.
