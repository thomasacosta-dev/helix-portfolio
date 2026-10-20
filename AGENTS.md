## SECCIONES CONGELADAS (no tocar)
Las tres primeras secciones del sitio están APROBADAS por el dueño del
proyecto y no se modifican: (1) Hero con logo de partículas, (2) Manifiesto
("Trabajamos donde la operación se vuelve compleja..."), (3) "Dónde
trabajamos" (globo, arcos y panel "Horas compartidas con Colombia"). También
quedan congelados el header, el preloader y la tipografía/paleta base.

Punto de restauración: tag git `secciones-aprobadas-v1`.

Reglas:
- No edites el markup, estilos, texto ni comportamiento de esas secciones, ni
  los archivos de escena asociados (HelixScene.astro, GlobeScene.astro,
  helix-particles.worker.js), aunque la tarea parezca relacionada.
- Las secciones nuevas (Industrias, Método, Casos, Contacto, footer) van en
  componentes y archivos CSS NUEVOS (por ejemplo src/components/Industrias.astro
  y src/styles/sections/industrias.css). En index.astro solo se permite AÑADIR
  la importación y el uso del componente nuevo, nunca modificar lo existente.
- No cambies variables globales (colores, tipografía, gutter, z-index del
  canvas ni tamaños base) que alteren esas secciones. Si algo nuevo necesita
  un token, crea uno nuevo con otro nombre.
- Si una tarea exige tocar algo congelado, DETENTE y pregunta antes.
- Al terminar cada tarea, ejecuta
  `git diff secciones-aprobadas-v1 --stat` y reporta qué archivos cambiaron;
  confirma que ninguna línea de las secciones congeladas se modificó.
## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
