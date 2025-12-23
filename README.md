# ToDo Minimalista

Aplicación de tareas en React + Vite con interfaz oscura y enfoque minimalista. Guarda todo en `localStorage`, permite filtrar, buscar, priorizar, reordenar por drag & drop y exportar/importar en JSON.

## Características
- Crear, completar, editar (doble click) y eliminar tareas.
- Prioridades Alta/Media/Baja con indicador de color.
- Filtros (todas, pendientes, completadas) y búsqueda por texto.
- Reordenar tareas visibles arrastrando y soltando.
- Exportar a `todos.json` e importar desde un JSON compatible.
- Limpieza rápida de completadas y contador de pendientes/total.
- Guardado automático en `localStorage` sin backend.

## Requisitos
- Node.js >= 18 y npm.

## Puesta en marcha
Desde la raíz del repo:
```bash
cd todo-minimalista
npm install      # primera vez
npm run dev      # http://localhost:5173
```

Scripts útiles:
- `npm run build`: genera la versión de producción en `dist/`.
- `npm run preview`: sirve el build para verificación local.
- `npm run lint`: ejecuta ESLint.

## Uso rápido
- Escribe la tarea y elige prioridad, luego "Agregar".
- Usa las chips para filtrar y el buscador para localizar por texto.
- Marca el checkbox para completar; doble click en el texto para editar.
- Cambia la prioridad desde el select de cada ítem.
- Arrastra una tarea para reordenar la lista visible.
- Exporta/Importa con los botones superiores; "Limpiar completadas" elimina las ya terminadas.

## Notas de datos
- Toda la información se guarda en el navegador; limpiar el almacenamiento local del sitio borra las tareas.
- El archivo JSON exportado es el que puede volver a importarse (estructura compatible con `src/App.jsx`).
