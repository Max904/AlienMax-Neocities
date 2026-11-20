# ✦ AlienMax's Space Blog ✦

Blog estilo 2010, morado y espacial, con Ditto caminando por la página.
Se publica automáticamente en [Neocities](https://neocities.org) con
[Deploy to Neocities](https://github.com/marketplace/actions/deploy-to-neocities).

## Estructura

```
public/                  <- todo lo que se sube a Neocities
  index.html  blog.html  sobre-mi.html  galeria.html  libro-de-visitas.html
  css/  js/  assets/
.github/workflows/deploy.yml
```

## Configuración (una sola vez)

1. En Neocities entra a `https://neocities.org/settings/TU-SITIO#api_key` y copia el API key.
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Nombre: `NEOCITIES_API_TOKEN`
   - Valor: el API key
3. Haz push a `main`; el workflow sube solo los archivos que cambiaron.

## Uso diario

Edita los archivos dentro de `public/`, haz commit y push a `main`. También puedes
lanzar el deploy a mano desde la pestaña **Actions → Deploy to Neocities → Run workflow**.

> Los archivos que ya existan en Neocities y no estén en `public/` no se borran,
> salvo que pongas `cleanup: true` en el workflow.
