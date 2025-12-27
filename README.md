# ToDo Minimalista

Aplicacion de tareas en React + Vite con interfaz oscura y foco en simplicidad. Todas las tareas se guardan en `localStorage`; incluye filtros, busqueda, prioridades, drag & drop y exportar/importar en JSON.

## Caracteristicas clave
- CRUD completo: crear, completar, editar (doble click) y eliminar.
- Prioridades Alta/Media/Baja con indicador de color y cambio in-line.
- Filtros por estado (todas, pendientes, completadas) y busqueda textual.
- Reordenamiento por drag & drop de la lista visible.
- Exportar a `todos.json` e importar desde JSON compatible.
- Limpieza rapida de completadas y contador de pendientes/total.
- Persistencia local: sin backend, todo vive en el navegador.

## Stack
- React 19 + Vite.
- CSS plano (sin dependencias de UI).
- ESLint para estandarizar el codigo.

## Requisitos
- Node.js >= 18 y npm.

## Instalacion y ejecucion
En la raiz del proyecto:
```bash
npm install      # primera vez
npm run dev      # abre en http://localhost:5173
```

## Scripts
- `npm run dev`: modo desarrollo con HMR.
- `npm run build`: genera artefactos de produccion en `dist/`.
- `npm run preview`: sirve el build para verificacion local.
- `npm run lint`: corre ESLint.

## Estructura breve
- `src/App.jsx`: logica principal de la app y gestion de estado.
- `src/styles.css`: estilos globales y componentes de UI.
- `public/`, `index.html`, `main.jsx`: bootstrap de Vite/React.

## Uso rapido
- Escribe la tarea, elige prioridad y haz click en "Agregar".
- Usa las chips de filtro y el buscador para acotar resultados.
- Marca el checkbox para completar; doble click en el texto para editar.
- Ajusta la prioridad desde el select de cada item.
- Arrastra tareas para reordenar; exporta/importa con los botones superiores; "Limpiar completadas" borra las ya terminadas.

## Roadmap (en curso)
### Accesibilidad (A11y)
- Navegacion completa por teclado (Tab, Enter, Escape) con estados claros usando :focus-visible.
- Ajuste de contraste para cumplir WCAG AA.
- Etiquetado semantico y `aria-label` descriptivos en controles.

### Microinteracciones y animaciones
- Fade + slide en entrada/salida de tareas.
- Transicion visual al marcar una tarea como completada.
- Feedback mas claro en hover/acciones primarias; evaluar framer-motion para mas control.

### Experiencia de usuario y producto
- "Undo" al eliminar tareas con snackbar temporal.
- Orden automatico configurable (prioridad/estado/fecha) compatible con drag & drop manual.
- Mensajes y vacios guiados para mejorar descubribilidad.

### Estadisticas y visualizacion
- Porcentaje de tareas completadas y contador por prioridad.
- Metricas simples de productividad diaria.

### Organizacion y escalabilidad

### Persistencia y mantenimiento
- Versionado del schema en `localStorage` con migraciones automaticas.
- Compatibilidad entre versiones exportadas de JSON.

### Mejoras avanzadas
- PWA con soporte offline.
- Internacionalizacion (i18n) con cambio de idioma en tiempo real.
- Tests basicos de logica y estado.
