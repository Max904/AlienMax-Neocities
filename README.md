# ✦ AlienMax's Space Blog ✦

Blog estilo 2010, morado y espacial, con un Ditto shimeji (motor de Shimeji-ee portado a JavaScript) que camina, salta, trepa y se divide por la página.

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
  js/ditto.js                <- motor del Ditto shimeji (lee ditto-config.js = actions.xml + behaviors.xml)
  js/ditto-config.js         <- generado por tools/build-ditto.py
  js/ditto-sounds.js         <- gritos en mp3/base64 (generado), se carga solo al hacer falta
  assets/ditto/              <- sprites Ditto y Ditto_Shiny
admin/                       <- panel de edición, solo en GitHub Pages (no va a Neocities)
  index.html  admin.js  admin.css
.github/workflows/
  pages.yml                  <- en cada push a main: public/ + admin/ -> GitHub Pages
  deploy.yml                 <- SOLO a mano (botón del panel o Actions): public/ -> Neocities
```

Estilo &laquo;web 2010&raquo; (Verdana/Georgia, degradados glossy, barra de pestañas) en `public/css/retro.css`.

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
     - **Issues: Read and write** (para revisar los mensajes de los visitantes)
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
| Visitas y me gusta | Contadores compartidos en Abacus (`public/js/counters.js`), iguales para todos |
| Firmas y comentarios pendientes | En el navegador del visitante hasta que los apruebes |
| Borrador y token del panel | Solo en tu navegador |


## Libro de visitas y comentarios (moderados por ti)

El visitante **no necesita nada**: escribe, elige Anónimo o su usuario de Neocities (se muestra como enlace a `usuario.neocities.org`; no se verifica que sea suyo) y envía.

1. Crea el secreto de repo **`NTFY_TOPIC`** (**Settings → Secrets and variables → Actions → New repository secret**); los workflows lo ponen en el sitio al publicar.
   Inventa un nombre largo y difícil de adivinar, por ejemplo `alienmax-k3x9q7p2z8` (letras, números, `-` y `_`).
   Recibes cada mensaje al instante instalando la app **ntfy** (Android/iOS) y suscribiéndote a ese tema, o abriendo `https://ntfy.sh/TU-TEMA` en el navegador. No hace falta cuenta ni activación.
   Como el tema queda en el código público, cualquiera podría leer o mandar avisos a ese tema; nada de eso publica nada en tu sitio, porque todo pasa por tu aprobación.
2. Con ntfy, el aviso trae un botón **«Revisar y aprobar»**: lo tocas y se abre el panel con el mensaje ya cargado. Ahí eliges
   **✔ Aprobar y publicar** (lo guarda en GitHub y lo publica en Neocities en un solo paso) o **✕ Descartar**. Sin copiar ni pegar.
   Para que funcione desde el celular, abre el panel una vez en ese navegador, conecta usuario/repo/token y marca «Recordar el token en este navegador».
   El enlace del panel se configura en `admin` de `public/data/social.js`. Aprobar guarda `content.js` en el repo, así que verás un commit por cada mensaje aprobado.
   (También puedes pegar el texto del mensaje en la pestaña **💬 Mensajes**.)
   Al aprobar se añade al libro de visitas o a la entrada del blog.
3. **Guarda y publica** como siempre: desde ese momento lo ve todo el mundo.

Si no configuras `NTFY_TOPIC`, el mensaje se abre como una **Issue** de tu repo (`repo` en `public/data/social.js`); entonces el visitante necesita cuenta de GitHub, pero tú puedes pulsar «Buscar mensajes nuevos» en el panel
(el token necesita **Issues: Read and write**) y las Issues se cierran solas al aprobar.

Mientras espera aprobación, el visitante ve su mensaje en su navegador marcado como «pendiente». Las firmas aprobadas se editan o borran en la misma pestaña; los comentarios, en Blogs (`@usuario: texto` enlaza a ese Neocities).
Hay trampa anti-bots, 1 envío cada 20 s y límite de 300 caracteres.

## Ditto shimeji

`public/js/ditto.js` ejecuta el pack «0132 - Ditto Shimeji» con las mismas reglas del original
(acciones, comportamientos, frecuencias, gravedad, saltos, paredes, techo, «Find a Ditto Friend», Dittosis, shiny…).
Se puede **agarrar y lanzar** con el ratón/dedo; un clic corto muestra una frase.

Ajustes arriba de `ditto.js` (`SETTINGS`): `maxMascots` (tope de Dittos, 50 como en el original), `sound` (gritos) y `phrases`.
Para regenerar sprites/config desde el pack original: `python3 tools/build-ditto.py RUTA/0132_-_Ditto_Shimeji`.


## Contadores compartidos (visitas y me gusta)

`public/js/counters.js` usa [Abacus](https://abacus.jasoncameron.dev) (gratis, sin registro) para que el contador de visitas y los me gusta sean los mismos para todos.
- **Visitas:** cada carga de página suma 1. El número parte de 0 (`START` en `main.js`); el contador se reinició usando la clave `visitas-v2`. Si no puede conectar, deja el último valor y lo explica al pasar el mouse por encima.
- **Me gusta:** cada navegador puede dar 1 por entrada y quitarlo con otro clic. Como Abacus solo suma, se guardan dos contadores (`like-<id>` y `unlike-<id>`) y el total es el `likes` de la entrada en el panel + me gusta − quitados.
- Si Abacus no responde, el sitio sigue funcionando con el último valor visto.
- Límite del servicio: 30 peticiones cada 10 s por IP (el sitio las espacia). Cualquiera podría sumar por su cuenta llamando a esa API: no es un contador a prueba de trampas.
- Para reiniciar solo las visitas, cambia la clave `visitas-v2` en `main.js` (y la de `localStorage`). Para empezar todo de cero (visitas y me gusta), cambia `NS` en `counters.js`.
