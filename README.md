# Proyecto Login - Express y MongoDB

API para autenticacion y gestion de usuarios con Node.js, Express y MongoDB.

## Requisitos

- Node.js 18+
- MongoDB local o remoto

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm run dev
```

Servidor por defecto: `http://localhost:3000`

## Variables de entorno

- `PORT`: puerto del servidor (opcional)
- `MONGO_URI`: cadena de conexion a MongoDB (opcional, por defecto `mongodb://localhost:27017/inventariodg`)

## Servicios implementados

- Servicio de autenticacion: `POST /login`
- Servicio de usuarios:
  - `POST /usuariosdg`
  - `GET /usuariosdg`
  - `GET /usuariosdg/:usuario`
  - `PUT /usuariosdg/:usuario`
  - `DELETE /usuariosdg/:usuario`

Documentacion tecnica detallada en `docs/servicios.md`.

## Versionamiento del proyecto

El proyecto se encuentra en un repositorio Git para control de versiones.

Comandos utiles:

```bash
git status
git add .
git commit -m "feat: descripcion del cambio"
git log --oneline
```
