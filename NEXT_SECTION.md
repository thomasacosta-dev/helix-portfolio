# HELIX - Proxima seccion

## Estado actual

- Sitio en Astro con TypeScript y Vercel como destino.
- Hero con preloader, nombre `Equipo HELIX · Ingenieria operativa` y helix WebGL.
- Tipografia autoalojada: Bricolage Grotesque Variable y DM Sans Variable.
- Secciones construidas: capacidades, industrias, metodo, casos, equipo, stack y contacto.
- Idiomas disponibles: espanol e ingles.
- Fotos editoriales temporales incluidas para evitar secciones vacias.
- Taste lint actual: `0 FAIL, 0 WARN`.

## Pendientes generales

- Reemplazar fotos de Unsplash por imagenes aprobadas por HELIX o archivos con licencia confirmada.
- Reemplazar todos los textos `[PLACEHOLDER]` con casos, resultados y nombres reales.
- Conectar el formulario con una agenda o endpoint real.
- Agregar favicon, logo final y metadatos Open Graph con imagen propia.
- Dividir el bundle de Three.js y GSAP para reducir el warning de archivos mayores a 500 kB.
- Probar rendimiento en un telefono real de gama media.
- Confirmar contraste y foco visible en ambos idiomas.

## Proxima seccion recomendada

### Metodo: Entender, Enfocar, Construir, Aprender

Es la siguiente seccion recomendada porque explica como HELIX convierte un problema operativo en una entrega concreta. Ya existe una primera version sticky, pero necesita una ronda dedicada de contenido y movimiento.

## Contenido que debe definirse

- Una frase corta y clara para cada etapa.
- Que recibe el cliente en cada etapa.
- Que decision se toma antes de avanzar.
- Diferencia entre proyecto cerrado y equipo dedicado.
- Duracion solo si HELIX proporciona datos reales.
- Evidencia real o `[PLACEHOLDER]`; no inventar clientes, metricas ni resultados.

## Direccion visual

- Mantener fondo azul noche, texto marfil y azul electrico como acento dominante.
- No volver a tarjetas iguales ni bloques multicolor.
- Cada estado debe sentirse como un tramo de la helix.
- Usar tipografia grande para los nombres de las etapas.
- Mantener una sola idea dominante por viewport.
- Evitar eyebrows tipo chip, numeracion decorativa y gradientes genericos.

## Movimiento

- ScrollTrigger puede controlar el estado activo mientras el bloque permanece fijado.
- Animar solo `transform`, `opacity` y cambios de color puntuales.
- Usar `ease-out` para entradas y `ease-in-out` para desplazamientos.
- Mantener transiciones de interfaz por debajo de 300 ms.
- No actualizar React o el DOM completo en cada frame.
- Desactivar el movimiento decorativo con `prefers-reduced-motion`.
- El cambio de estado debe seguir siendo entendible sin JavaScript.

## Responsive

### Desktop

- Cuatro etapas visibles como columnas altas.
- Una etapa activa con mayor contraste.
- El texto debe caber sin truncarse.

### Mobile

- Etapas apiladas verticalmente.
- Sin pinning obligatorio.
- Cada etapa debe poder leerse sin scroll horizontal.
- El texto activo debe ser visible por defecto.
- Los botones y links deben tener un area tactil comoda.

## Accesibilidad

- Usar headings semanticos y ordenados.
- Si una etapa es interactiva, usar `button` o `a`, no un `div` clickable.
- Mantener foco visible con teclado.
- No depender solo del color para indicar la etapa activa.
- Verificar textos en espanol e ingles con longitudes diferentes.
- Mantener inputs en `16px` como minimo en movil.

## Checklist antes de cerrar

- [ ] Brief de la seccion escrito antes del markup.
- [ ] Copy espanol aprobado.
- [ ] Copy ingles equivalente, no traduccion literal superficial.
- [ ] Estado sin JavaScript legible.
- [ ] Motion revisado con criterio de Emil Kowalski.
- [ ] No hay propiedades de layout animadas.
- [ ] Metodo probado a 1440px, 1024px y 390px.
- [ ] Prueba con nombres y textos largos.
- [ ] Build Astro exitoso.
- [ ] Taste lint en `0 FAIL, 0 WARN`.
- [ ] Auditoria Impeccable ejecutada.
- [ ] Capturas desktop y mobile guardadas en `.impeccable/review/`.
- [ ] `DESIGN.md` actualizado si cambia el sistema visual.
- [ ] Placeholders listados para reemplazo.

## Archivos a revisar

- [index.astro](src/pages/index.astro)
- [HelixScene.astro](src/components/HelixScene.astro)
- [global.css](src/styles/global.css)
- [DESIGN.md](DESIGN.md)
- [PRODUCT.md](PRODUCT.md)
