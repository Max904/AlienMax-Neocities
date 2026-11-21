# ✦ AlienMax's Space Blog ✦

Blog estilo 2010, morado y espacial, con Ditto caminando por la página.

- **El sitio** (`public/`) se publica en [Neocities](https://neocities.org) con
  [Deploy to Neocities](https://github.com/marketplace/actions/deploy-to-neocities).
- **El panel de edición** (`admin/`) vive en GitHub Pages, junto a una copia del sitio.

## Cómo funciona (dos pasos)

```
editas en el panel
   │
   ├─ PASO 1 · Guardar en GitHub ──► commit a public/data/content.js
   │                                   └─► pages.yml actualiza la copia en GitHub Pages  (revisas aquí)
   │
   └─ PASO 2 · Publicar en Neocities ─► lanza deploy.yml a mano ──► sube public/ a Neocities
```

Guardar en GitHub **no toca Neocities**. Solo cuando todo se vea bien en la copia de GitHub Pages
pulsas **Publicar en Neocities**. Antes de guardar también puedes usar los enlaces de "vista previa"
del panel, que muestran el sitio con tu borrador.

## Estructura

```
public/                      <- lo que se sube a Neocities (y la copia en GitHub Pages)
  index.html  blog.html  musica.html  sobre-mi.html  galeria.html  libro-de-visitas.html
  data/content.js            <- TODO el contenido editable (perfil, textos, blogs, música, galería)
  css/  js/  assets/         (assets/uploads/ = imágenes subidas desde el panel)
admin/                       <- panel de edición, solo en GitHub Pages (no va a Neocities)
  index.html  admin.js  admin.css
.github/workflows/
  pages.yml                  <- en cada push a main: public/ + admin/ -> GitHub Pages
  deploy.yml                 <- SOLO a mano (botón del panel o Actions): public/ -> Neocities
```

Todas las páginas comparten el mismo lateral (Perfil, Datos, Visitas y Botones) y un único gif arriba.

El contenido vive en **`public/data/content.js`**. Las páginas se arman desde ese archivo,
así que para cambiar textos, entradas, música o imágenes no hace falta tocar el HTML.

## Configuración (una sola vez)

### 1. Neocities (el sitio)

1. En Neocities entra a `https://neocities.org/settings/TU-SITIO#api_key` y copia el API key.
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Nombre: `NEOCITIES_API_TOKEN`
   - Valor: el API key

`deploy.yml` ya no se ejecuta solo con cada push: se lanza desde el panel (paso 2) o a mano en
**Actions → Deploy to Neocities → Run workflow**.

### 2. GitHub Pages (el panel y la copia de revisión)

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Haz push a `main` (o **Actions → Panel admin en GitHub Pages → Run workflow**).
3. El panel queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/admin/`.
   La copia del sitio queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

### 3. Token de GitHub para el panel

1. En GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Repository access: *Only select repositories* → este repo.
   - Permissions → Repository permissions:
     - **Contents: Read and write** (para guardar los cambios)
     - **Actions: Read and write** (para lanzar y seguir el deploy a Neocities)
2. En el panel, pestaña **Guardar y publicar**: el usuario y el repo ya aparecen rellenos, escribe la rama
   (`main`) y pega el token. Usa **Probar conexión** para comprobarlo; avisa si falta algún permiso.

El token se guarda solo en tu navegador y solo se envía a `api.github.com`.
No lo uses en un computador compartido (o desmarca "Recordar el token").

## Editar con el panel

Pestañas:

- **Sitio y perfil**: títulos, texto que se desplaza, nombre, estado, ánimo y foto.
- **Inicio y sobre mí**: bienvenida, presentación, cosas favoritas, lema y amigos.
- **Blogs**: crear, editar, ordenar y borrar entradas (fecha, etiquetas, imagen, texto, comentarios).
- **Música**: canciones con portada, nota y enlace. Si el enlace es de YouTube se puede reproducir en la página.
  Al elegir la portada se muestran las carátulas que ya usan otras canciones, para repetir la del mismo álbum, y las imágenes ya subidas al repo.
- **Galería**: imágenes con texto, y subida de imágenes nuevas (van a `public/assets/uploads/`).
- **Gifs y fondos**:
  - *Gif general de arriba*: el que usan todas las pestañas que no tengan uno propio.
  - *Por pestaña*: a cada pestaña le puedes escoger su **gif de la parte superior** (vacío = el general) y su **fondo** (vacío = fondo de galaxia).
    Por defecto Blogs usa `purple-water.gif` de fondo; las demás, la galaxia. Los fondos pequeños se repiten como mosaico.
  - *Cuadro grande del inicio*: el cuadro con el gif de aliens debajo de «Última transmisión» (solo en el inicio), con título opcional.
  Se guardan como `topGif`, `backgrounds` y `homeBox` en `content.js`; los valores originales están en `public/js/page-gifs.js`.
- **Guardar y publicar**: conexión con GitHub y los dos pasos.

La barra de arriba indica en qué punto estás:

| Indicador | Significa |
| --- | --- |
| Cambios sin guardar en GitHub | Editaste algo; solo existe como borrador en tu navegador |
| Guardado en GitHub · falta publicar en Neocities | Ya está en el repo y en la copia de Pages, pero Neocities sigue con la versión anterior |
| Todo al día | Neocities tiene lo mismo que GitHub |

Al abrir el panel (con el token ya guardado) carga la **última versión guardada en GitHub**, no la copia de
Pages, que puede estar en caché unos minutos. El botón **Cargar última versión de GitHub** hace lo mismo a mano.

En cualquier campo de imagen, **Elegir una imagen ya subida** abre la lista de imágenes del repo (`public/assets/`
y `public/assets/uploads/`) y de las que el sitio ya usa. Para ver las del repo el panel necesita estar conectado al token.

Si en GitHub Pages ves la versión anterior después de guardar, espera a que el paso 1 diga que la copia está
actualizada y recarga con Ctrl+F5.

### Sin el panel

Puedes editar `public/data/content.js` a mano (en GitHub o en tu computador) y hacer push a `main`:
eso actualiza la copia de GitHub Pages. Para subirlo a Neocities, lanza **Deploy to Neocities** desde Actions.
También hay un botón **Descargar content.js** en el panel por si prefieres reemplazar el archivo tú mismo.

## Notas

- Los archivos que ya existan en Neocities y no estén en `public/` no se borran,
  salvo que pongas `cleanup: true` en `deploy.yml`.
- Si en algún momento subiste `admin.html` a Neocities, bórralo desde su panel de archivos.

| Cosa | Dónde |
| --- | --- |
| Textos, blogs, música, galería | `public/data/content.js` (en el repo, se publica) |
| Imágenes subidas desde el panel | `public/assets/uploads/` (en el repo) |
| Visitas, likes y libro de visitas | En el navegador de cada visitante (`localStorage`), no en el repo |
| Borrador y token del panel | Solo en tu navegador |
