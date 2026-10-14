# Backlog del Proyecto - Sistema Personal de Finanzas

## ✅ Implementado / Completado
- [x] Estructuración y unificación del esquema de base de datos en SQLite (`account`, `category`, `credit_card_installments`, `transaction`, `transfer`).
- [x] Creación de migraciones defensivas y manejo seguro de columnas (`type`, `closing_day`, `due_day`, `image_path`, etc.).
- [x] Backend modular desacoplado (módulo de rutas para tarjetas de crédito y cuentas).
- [x] Configuración inicial del entorno y estructura base web/backend local.

## 🚀 Corto Plazo (Siguientes pasos funcionales)
- [ ] Consolidar el ABM visual de Tarjetas de Crédito en la interfaz web (CRUD completo).
- [ ] Registrar compras en cuotas y pagos de resumen desde la sección de Movimientos.
- [ ] Importación y exportación de la base de datos (Backup y restauración manual).
- [ ] Conectar vencimientos de servicios, agregarlos al calendario "pagos" y sumar el vencimiento al presupuesto.

## 📌 Mediano Plazo (Interfaz Web, Analítica e Informes)
- [ ] **Cambio de apariencia web (temas / diseño visual).**
- [ ] Generación de presupuestos.
- [ ] Generación de informes enriquecidos de categorías.
- [ ] Visualización bimonetaria en las cuentas.
- [ ] Gráficos de evolución temporal y comparación de gastos mensuales en la PC local.
- [ ] Visualización de cierres de mes y reportes de categorías.
- [ ] Importación de extractos bancarios.

## 🔮 Largo Plazo (Inversiones, Integraciones Externas, App Android y Sincronización)
- [ ] **appROL (Gestión de perfiles/roles de usuario y permisos en la aplicación).**
- [ ] Ir a buscar datos a la app de básquet, calendarizar eventos y estimar el gasto asociado.
- [ ] Manejo de inversiones y lógicas para que impacten en el presupuesto (ej. considerar pagos futuros de obligaciones negociables).
- [ ] Desarrollo de la aplicación Android para carga ultrarrápida en la calle.
- [ ] Modo Offline en Android con sincronización automática/a demanda al reconectar.
- [ ] Integración de cotizaciones automáticas (Dólar, Bitcoin/Binance, UVA).
--------------------------------------
# Backlog del Proyecto - Sistema Personal de Finanzas

## ✅ Implementado / Completado
- [x] **Esquema de Base de Datos y Estructura:** Modelado unificado en SQLite (`account`, `category`, `credit_card_installments`, `transaction`, `transfer`, `settings`).
- [x] **Backend Modular:** Enrutadores desacoplados para cuentas (`accounts.ts`), transacciones (`transactions.ts`), transferencias y tarjetas de crédito (`creditCards.ts`).
- [x] **Motor de Tarjetas de Crédito y Cuotas:** 
  - Soporte de cuentas de tipo `credit_card` con días de cierre y vencimiento.
  - Registro de compras fraccionadas y generación automática de cuotas en la tabla `credit_card_installments`.
- [x] **Interfaz Web de Movimientos (`movements.js`):**
  - Formulario unificado para Gastos, Ingresos y Transferencias.
  - Detección dinámica de tarjetas de crédito con selector de cuotas (1, 2, 3, 6, 12, 18).
  - Manejo de transferencias multimoneda (ej. ARS a USD).
- [x] **Cotizaciones en Tiempo Real (`settings` y `/api/rates`):**
  - Configuración de fuentes de divisas (Oficial, Blue, MEP).
  - Integración de la cotización real en el cálculo automático de transferencias multimoneda.

## 🚀 Corto Plazo (Siguientes pasos funcionales)
- [ ] Consolidar el ABM visual de Tarjetas de Crédito en la interfaz web (CRUD completo).
- [ ] Visualización de la proyección de pagos e informes de cuotas pendientes mes a mes.
- [ ] Importación y exportación de la base de datos (Backup y restauración manual).
- [ ] Conectar vencimientos de servicios y agregarlos al flujo financiero.

## 📌 Mediano Plazo (Interfaz Web, Analítica e Informes)
- [ ] Cambio de apariencia web (temas / diseño visual).
- [ ] Generación de presupuestos.
- [ ] Generación de informes enriquecidos de categorías y gastos mensuales.
- [ ] Gráficos de evolución temporal en la PC local.
- [ ] Importación de extractos bancarios.

## 🔮 Largo Plazo (Inversiones, Integraciones Externas, App Android y Sincronización)
- [ ] Gestión de perfiles/roles de usuario y permisos en la aplicación.
- [ ] Manejo de inversiones e impacto en el presupuesto (ej. obligaciones negociables).
- [ ] Desarrollo de la aplicación Android para carga ultrarrápida en la calle.
- [ ] Modo Offline en Android con sincronización automática/a demanda al reconectar.