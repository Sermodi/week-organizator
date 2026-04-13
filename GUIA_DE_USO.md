# WeekOrganizator — Guía de Uso

## Concepto

WeekOrganizator es un wizard secuencial de 5 pasos para planificar tu semana. Cada paso desbloquea el siguiente. El proceso completo se hace **una vez por semana**, idealmente el domingo o lunes.

---

## Flujo completo

```
Dashboard → Paso 1 → Paso 2 → Paso 3 → Paso 4 → Paso 5 → ✓ Semana completada
```

Los pasos son **lineales**: no puedes ir al paso 3 sin haber completado el 2. El progreso se guarda automáticamente — puedes cerrar y volver cuando quieras.

---

## Paso 1 — Volcado mental

**Objetivo:** Sacar todo lo que tienes en la cabeza sin filtrar.

1. Escribe una tarea, proyecto o preocupación en el campo de texto.
2. Pulsa `Enter` o el botón **Añadir**.
3. Repite hasta vaciar la cabeza. Hay un temporizador opcional de 20 minutos.
4. Puedes asignar un **área** a cada elemento (trabajo, personal, salud…).
5. Pulsa **Continuar** cuando tengas **al menos 1 elemento**.

> No juzgues ni filtres aquí. Añade todo — tareas grandes, pequeñas, incertidumbres.

---

## Paso 2 — Priorizar

**Objetivo:** Identificar qué merece realmente tu tiempo esta semana.

### Cómo funciona

Cada elemento del volcado mental aparece con:

- **Slider de puntuación (0–100):** ¿Cuánto impacto tiene esto? La regla es: si no es un SÍ rotundo (≥90), es un no.
- **Botones de clasificación:**
  - `Top 3` — entra en tu lista de prioridades reales de la semana
  - `Esencial` — importante pero no es top
  - `Omitir` — no esta semana

### Pasos concretos

1. Mueve el slider para puntuar cada elemento.
2. Haz clic en `Top 3`, `Esencial` u `Omitir` para cada uno.
3. Entre los que marcaste como **Top 3**, haz clic en la **estrella (⭐)** del más importante — ese será tu **#1**.
4. Pulsa **Continuar** cuando hayas clasificado al menos uno y tengas un #1 marcado.

### Errores comunes

| Error | Causa | Solución |
|---|---|---|
| *"Clasifica al menos una prioridad para continuar"* | Ningún elemento tiene clasificación guardada | Haz clic en `Top 3`, `Esencial` u `Omitir` — el slider solo no basta |
| *"Selecciona tu prioridad #1 para continuar"* | Tienes Top 3 pero no hay estrella marcada | Haz clic en la ⭐ que aparece a la izquierda de un elemento Top 3 |

> **Importante:** La estrella solo aparece si el elemento ya tiene la clasificación `Top 3` seleccionada. Orden correcto: primero clasifica como Top 3, luego marca la estrella.

---

## Paso 3 — Definir acciones

**Objetivo:** Convertir cada prioridad en una tarea concreta y ejecutable.

Para cada prioridad del paso 2:

1. Elige un **verbo de acción** (Escribir, Crear, Revisar…).
2. Define el **objeto concreto** (¿exactamente qué?).
3. Escribe la **condición de éxito** — "Listo cuando…" (mínimo 10 caracteres).
4. Pulsa **Añadir tarea**.

Puedes definir varias tareas por prioridad. Pulsa **Continuar** cuando tengas **al menos 1 tarea**.

> Ejemplo: `Escribir` + `el borrador del informe Q1` → Listo cuando: *"Tiene introducción, 3 secciones y conclusión, revisado una vez"*

---

## Paso 4 — Bloquear tiempo

**Objetivo:** Asignar tus tareas a días y horas concretos de la semana.

### Vista semanal

Verás una cuadrícula con los 7 días. Cada columna es un día (Lun–Dom).

- El botón **+** de cada día abre el formulario para añadir un bloque.
- Los bloques existentes muestran la tarea y el horario. Pasa el ratón para ver el botón de eliminar (×).

### Añadir un bloque

1. Haz clic en **+** bajo el día que quieras.
2. Elige la **tarea** (o déjalo sin tarea y pon una etiqueta libre).
3. Selecciona el **día**, **tipo de bloque**, **hora de inicio** y **hora de fin**.
4. Pulsa **Añadir bloque**.

**Tipos de bloque:**
- `Tarea` — trabajo normal
- `Trabajo profundo` — foco máximo, sin interrupciones
- `Compromiso fijo` — reunión, cita inamovible
- `Margen` — tiempo de buffer entre tareas

### Banner amarillo

Si tu tarea #1 no está programada, aparece un aviso en la parte superior. Programa primero tu prioridad más importante.

Pulsa **Continuar** cuando hayas terminado (no hay mínimo obligatorio).

---

## Paso 5 — Reflexión

**Objetivo:** Revisar la semana antes de que termine para aprender y mejorar.

Rellena los 3 campos:

1. **¿Qué ha funcionado?** — hábitos, sistemas o acciones que ayudaron
2. **¿Qué no ha funcionado?** — distracciones, fallos del plan
3. **¿Qué cambiarías?** — un ajuste concreto para la próxima semana

Los campos se guardan automáticamente al salir de cada uno (onBlur).

Opcionalmente, puntúa la semana del 1 al 5.

Pulsa **Finalizar semana** cuando los 3 campos tengan contenido.

---

## Dashboard

La página de inicio muestra:

- El rango de la semana actual (ej. *7 de abr – 13 de abr de 2025*)
- El progreso de los 5 pasos (completados con tachado + icono violeta)
- El botón **Continuar planificación** que lleva directamente al paso donde lo dejaste

---

## Áreas

Las áreas son categorías reutilizables entre semanas (Trabajo, Personal, Salud, etc.).

- Créalas en la sección **Áreas** del menú lateral.
- Asígnalas a elementos en el Paso 1 para organizar mejor el volcado.
- Cada área tiene un color personalizable.

---

## Historial

La sección **Historial** muestra todas las semanas anteriores con:

- El rango de fechas
- Los pasos completados
- Un resumen de la reflexión final

---

## Atajos de navegación

| Acción | Cómo |
|---|---|
| Volver al paso anterior | Botón **← Atrás** en la parte inferior izquierda |
| Avanzar al siguiente paso | Botón **Continuar** en la parte inferior derecha |
| Ir al dashboard | Clic en **WeekOrganizator** o **Esta semana** en el menú lateral |
| Cerrar sesión | **Cerrar sesión** al final del menú lateral |
