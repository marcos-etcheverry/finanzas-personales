# 💰 Finanzas Personales (Multiplataforma)

Sistema de gestión financiera personal soberano, privado y multiplataforma. Diseñado bajo la metodología **Simple → Funcional → Probado → Documentado → Extensible**, permitiendo el registro ágil de movimientos, gestión avanzada de tarjetas de crédito con cuotas, manejo multimoneda, sincronización con tasas en tiempo real y análisis desde la Web Local en la PC.

---

## 🏗️ Arquitectura del Sistema

```text
  ┌──────────────────────────────────────────────────────────┐
  │                 MODO CALLE (OFFLINE)                     │
  │  [ App Android (Kotlin / Compose) ]                      │
  │        │                                                 │
  │        ▼                                                 │
  │  [ SQLite Local (Room) ]  <-- Guarda transacciones local  │
  └────────────────────────┬─────────────────────────────────┘
                           │
                           │  LLEGÁS A CASA (Wi-Fi Local)
                           │  Sincronización a Demanda (HTTP REST)
                           ▼
  ┌──────────────────────────────────────────────────────────┐
  │                 PC LOCAL (EN CASA)                       │
  │  [ Backend API (Node.js / TS) ] ◄── (HTTP Fetch) ───┐    │
  │        │                                            │    │
  │        ▼                                            │    │
  │  [ SQLite Central (finanzas.db) ]           [ Web Local ]│
  └──────────────────────────────────────────────────────────┘
```

## 🚀 Stack Tecnológico

- **Backend:** Node.js + TypeScript + `better-sqlite3` (API REST HTTP nativa modular).
- **Base de Datos Central:** SQLite (`finanzas.db` en la PC, tablas normalizadas: `account`, `account_balance`, `category`, `transaction`, `transfer`, `credit_card_installments`, `settings`, etc.).
- **Web Local:** HTML5, CSS3, JavaScript Nativo (ES6 / Fetch API con vistas SPA dinámicas).
- **App Android:** Kotlin + Jetpack Compose + Retrofit + Gson (Room para persistencia local).
- **Red Local:** Peticiones HTTP directas sobre la red Wi-Fi de la PC.

---

## 📌 Estado Actual del Proyecto (Funcionalidades Clave)

- **Esquema de Base de Datos y Módulos Backend:** Enrutadores desacoplados para cuentas, transacciones, transferencias, tarjetas de crédito y configuraciones.
- **Motor de Tarjetas de Crédito y Cuotas:**
  - Soporte de cuentas de tipo `credit_card` con días de cierre y vencimiento.
  - Registro de compras fraccionadas y generación automática de cuotas en la tabla `credit_card_installments`.
- **Interfaz Web de Movimientos y Configuración:**
  - Formulario unificado para Gastos, Ingresos y Transferencias.
  - Detección dinámica de tarjetas de crédito con selector de cuotas.
  - Manejo de transferencias multimoneda (ej. ARS a USD).
- **Cotizaciones en Tiempo Real:**
  - Configuración de fuentes de divisas (Oficial, Blue, MEP).
  - Integración de cotizaciones reales en el cálculo automático de transferencias.

---

## 🛠️ Guía de Ejecución

### 1. Levantar el Backend (PC)
Desde la carpeta raíz o de backend:
```bash
npm start
# O alternativamente:
npx ts-node src/server.ts
```

### 2. Abrir la Web Local (PC)
Navegá desde cualquier browser a:
```text
http://localhost:3000
```

### 3. Ejecutar la App Android (Celular Físico)
1. Conectá el celular a la misma red Wi-Fi que la PC.
2. Abrí el proyecto en Android Studio.
3. Compilá y ejecutá en tu dispositivo físico apuntando a la IP local correspondiente.

---

## 📄 Licencia y Privacidad
Proyecto de uso personal y privado. Toda la información reside exclusivamente en tu almacenamiento local en disco.