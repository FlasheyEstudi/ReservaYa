# Guía de Implementación HTTPS (SSL) para Producción

El usuario solicitó implementar HTTPS. Dado que HTTPS es un protocolo de capa de transporte, **no se configura dentro del código de Node.js/Next.js** directamente en producción (aunque es posible), sino que se utiliza un **Servidor Web Inverso (Reverse Proxy)** como Nginx o Apache, o un proveedor de nube (Vercel, AWS, Cloudflare).

Aquí tienes la guía estándar para implementar SSL GRATIS usando **Certbot (Let's Encrypt)** en un servidor Linux (Ubuntu/Debian).

## 1. Requisitos
*   Un servidor VPS (DigitalOcean, AWS EC2, Linode, etc.) con Ubuntu 20.04/22.04.
*   Un dominio real apuntando a la IP del servidor (ej. `api.tu-restaurante.com` para el backend y `app.tu-restaurante.com` para el frontend).

## 2. Instalar Nginx y Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

## 3. Configurar Nginx (Reverse Proxy)

Edita el archivo de configuración: `sudo nano /etc/nginx/sites-available/reservaya`

```nginx
# Configuración para el Backend (API)
server {
    server_name api.tu-restaurante.com;

    location / {
        proxy_pass http://localhost:3000; # Apunta a tu Node.js Backend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Configuración para el Frontend (Next.js)
server {
    server_name app.tu-restaurante.com;

    location / {
        proxy_pass http://localhost:3001; # Apunta a tu Frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activa el sitio y reinicia Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/reservaya /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. Obtener SSL (HTTPS) Automático

Ejecuta Certbot. Este comando detectará tus dominios en Nginx, solicitará los certificados SSL gratuitos y reconfigurará Nginx automáticamente para usar HTTPS.

```bash
sudo certbot --nginx
```

Sigue las instrucciones en pantalla (selecciona "2" para redirigir todo el tráfico HTTP a HTTPS).

## 5. ¡Listo!
*   Tu sistema ahora es accesible vía `https://api.tu-restaurante.com` y `https://app.tu-restaurante.com`.
*   El candado verde aparecerá en el navegador.
*   Los pagos y la geolocalización funcionarán correctamente.

## Nota sobre WebSockets
Si usas WebSockets en un puerto separado (ej. 8002), también necesitas un bloque `server` en Nginx o usar el path `/socket.io/` en el bloque principal redirigiendo al puerto 8002.
