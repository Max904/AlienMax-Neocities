# ✦ AlienMax's Space Blog ✦

Blog estilo 2010, morado y espacial, con Ditto caminando por la página.

- **El sitio** (`public/`) se publica en [Neocities](https://neocities.org) con
  [Deploy to Neocities](https://github.com/marketplace/actions/deploy-to-neocities).
- **El panel de edición** (`admin/`) vive en GitHub Pages, junto a una copia del sitio.

## Estructura

```
public/                      <- lo que se sube a Neocities (y la copia en GitHub Pages)
  index.html  blog.html  musica.html  sobre-mi.html  galeria.html  libro-de-visitas.html
  data/content.js            <- TODO el contenido editable (perfil, textos, blogs, música, galería)
  css/  js/  assets/
admin/                       <- panel de edición, solo en GitHub Pages (no va a Neocities)
  index.html  admin.js  admin.css
.github/workflows/
  deploy.yml                 <- public/ -> Neocities
  pages.yml                  <- public/ + admin/ -> GitHub Pages
```

El contenido vive en **`public/data/content.js`**. Las páginas se arman desde ese archivo,
así que para cambiar textos, entradas, música o imágenes no hace falta tocar el HTML.

## Configuración (una sola vez)

### 1. Neocities (el sitio)

1. En Neocities entra a `https://neocities.org/settings/TU-SITIO#api_key` y copia el API key.
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - Nombre: `NEOCITIES_API_TOKEN`
   - Valor: el API key
3. Haz push a `main` (o **Actions → Deploy to Neocities → Run workflow**).

### 2. GitHub Pages (el panel)

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Haz push a `main` (o **Actions → Panel admin en GitHub Pages → Run workflow**).
3. El panel queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/admin/`.
   La copia del sitio queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

### 3. Token de GitHub para el panel

1. En GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Repository access: *Only select repositories* → este repo.
   - Permissions → Repository permissions → **Contents: Read and write**.
2. En el panel, pestaña **Publicar**: el usuario y el repo ya aparecen rellenos, escribe la rama (`main`)
   y pega el token. Usa **Probar conexión** para comprobarlo.

El token se guarda solo en tu navegador y solo se envía a `api.github.com`.
No lo uses en un computador compartido (o desmarca "Recordar el token").

## Editar con el panel

El panel tiene pestañas para:

- **Sitio y perfil**: títulos, texto que se desplaza, nombre, estado, ánimo y foto.
- **Inicio y sobre mí**: bienvenida, presentación, cosas favoritas, lema y amigos.
- **Blogs**: crear, editar, ordenar y borrar entradas (fecha, etiquetas, imagen, texto, comentarios).
- **Música**: canciones con portada, nota y enlace. Si el enlace es de YouTube se puede reproducir en la página.
- **Galería**: imágenes con texto, y subida de imágenes nuevas (van a `public/assets/uploads/`).
- **Publicar**: conexión con GitHub.

Mientras editas, los cambios quedan como **borrador en tu navegador**. Los enlaces de
"vista previa" muestran la copia del sitio en GitHub Pages con ese borrador, antes de publicarlo.

Al pulsar **Publicar** el panel hace un commit de `public/data/content.js` a GitHub. Eso lanza
los dos workflows: uno actualiza Neocities y el otro la copia de GitHub Pages (uno o dos minutos).
Si abres el panel justo después de publicar, espera a que termine el workflow para ver lo último.

### Sin el panel

Puedes editar `public/data/content.js` a mano (en GitHub o en tu computador) y hacer push a `main`.
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
