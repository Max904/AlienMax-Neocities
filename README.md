# ✦ AlienMax's Space Blog ✦

Blog estilo 2010, morado y espacial, con Ditto caminando por la página.
Se publica automáticamente en [Neocities](https://neocities.org) con
[Deploy to Neocities](https://github.com/marketplace/actions/deploy-to-neocities).

## Estructura

```
public/                      <- todo lo que se sube a Neocities
  index.html  blog.html  musica.html  sobre-mi.html  galeria.html  libro-de-visitas.html
  admin.html                 <- panel para editar el contenido
  data/content.js            <- TODO el contenido editable (perfil, textos, blogs, música, galería)
  css/  js/  assets/
.github/workflows/deploy.yml
```

El contenido vive en **`public/data/content.js`**. Las páginas se arman desde ese archivo,
así que para cambiar textos, entradas, música o imágenes no hace falta tocar el HTML.

## Editar con el panel (`/admin.html`)

Abre `https://TU-SITIO.neocities.org/admin.html`. Tiene pestañas para:

- **Sitio y perfil**: títulos, texto que se desplaza, nombre, estado, ánimo y foto.
- **Inicio y sobre mí**: bienvenida, presentación, cosas favoritas, lema y amigos.
- **Blogs**: crear, editar, ordenar y borrar entradas (fecha, etiquetas, imagen, texto, comentarios).
- **Música**: canciones recomendadas con portada, nota y enlace. Si el enlace es de YouTube se puede reproducir en la página.
- **Galería**: imágenes con texto, y subida de imágenes nuevas.
- **Publicar**: conexión con GitHub.

Mientras editas, los cambios quedan como **borrador en tu navegador**. Los botones de
"vista previa" arriba del panel muestran el sitio con ese borrador antes de publicarlo.
Al pulsar **Publicar** el panel hace un commit de `public/data/content.js` a GitHub, y el
workflow sube el cambio a Neocities (uno o dos minutos).

### Conectar el panel con GitHub (una sola vez)

1. En GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Repository access: *Only select repositories* → este repo.
   - Permissions → Repository permissions → **Contents: Read and write**.
2. En el panel, pestaña **Publicar**: escribe tu usuario de GitHub, el nombre del repo, la rama (`main`) y pega el token. Usa **Probar conexión** para comprobarlo.

El token se guarda solo en tu navegador y solo se envía a `api.github.com`.
No lo uses en un computador compartido (o desmarca "Recordar el token").

> `admin.html` es una página pública, pero sin tu token no puede publicar nada. Si prefieres
> que no esté en Neocities, mueve `admin.html`, `js/admin.js` y `css/admin.css` fuera de `public/`
> y ábrelo desde tu computador.

### Sin el panel

Puedes editar `public/data/content.js` a mano (en GitHub o en tu computador) y hacer push a `main`.
También hay un botón **Descargar content.js** en el panel por si prefieres reemplazar el archivo tú mismo.

## Configuración del deploy (una sola vez)

1. En Neocities entra a `https://neocities.org/settings/TU-SITIO#api_key` y copia el API key.
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Nombre: `NEOCITIES_API_TOKEN`
   - Valor: el API key
3. Haz push a `main`; el workflow sube solo los archivos que cambiaron.

También puedes lanzar el deploy a mano desde **Actions → Deploy to Neocities → Run workflow**.

> Los archivos que ya existan en Neocities y no estén en `public/` no se borran,
> salvo que pongas `cleanup: true` en el workflow.

## Qué se guarda dónde

| Cosa | Dónde |
| --- | --- |
| Textos, blogs, música, galería | `public/data/content.js` (en el repo, se publica) |
| Imágenes subidas desde el panel | `public/assets/uploads/` (en el repo) |
| Visitas, likes y libro de visitas | En el navegador de cada visitante (`localStorage`), no en el repo |
| Borrador y token del panel | Solo en tu navegador |
