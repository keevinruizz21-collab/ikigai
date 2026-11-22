#!/usr/bin/env python3
"""Arma la carpeta web/ de Ikigai a partir del código de Quincena.

Uso:
  python3 tools/build_web.py [organizador-codigo.json]

Si se pasa el archivo exportado desde Quincena (Entreno → Ajustes → Descargar código),
primero guarda sus fuentes en source/. Luego, desde source/, genera:
  web/index.html   (Quincena + núcleo de Ikigai + CSP estricta)
  web/quincena.js  (el script de Quincena, fuera del HTML para no permitir scripts en línea)
  web/entreno.js   (módulo de entreno sin la sección de exportación)
  web/estilo.js    (módulo de estilo: biblioteca de ropa, muñeco y guía)
  web/sw.js        (service worker con la lista de archivos para uso sin internet)
"""
import hashlib, json, os, re, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, WEB = os.path.join(ROOT, 'source'), os.path.join(ROOT, 'web')

def read(p): return open(p, encoding='utf-8').read()
def write(p, s):
    with open(p, 'w', encoding='utf-8', newline='\n') as f: f.write(s)

if len(sys.argv) > 1:
    pack = json.load(open(sys.argv[1], encoding='utf-8'))
    files = pack['files']
    os.makedirs(SRC, exist_ok=True)
    write(os.path.join(SRC, 'quincena.html'), files['index.html'])
    write(os.path.join(SRC, 'entreno.js'), files['entreno.js'])

html = read(os.path.join(SRC, 'quincena.html'))
cfg = read(os.path.join(WEB, 'ikigai', 'config.js'))
supa = re.search(r"https://([a-z0-9]+)\.supabase\.co", cfg)
if not supa: sys.exit('config.js no tiene la URL de Supabase')
host = supa.group(1) + '.supabase.co'

# 1. El script principal en línea pasa a quincena.js
scripts = [(m.start(), m.end(), m.group(1)) for m in re.finditer(r'<script>(.*?)</script>', html, re.S)]
if not scripts: sys.exit('No encontré el script de Quincena')
start, end, body = max(scripts, key=lambda s: len(s[2]))
BRAND_Q = '<span class="brand-mark">15·30</span><span class="brand-name">Quincena</span>'
BRAND_I = '<span class="brand-mark">生</span><span class="brand-name">Ikigai</span>'
body = body.replace('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'ikigai/vendor/xlsx.full.min.js')
body = body.replace('quincena-movimientos-', 'ikigai-movimientos-').replace('filename:`quincena-', 'filename:`ikigai-')
if 'cdnjs.cloudflare.com' in body: sys.exit('Quincena todavía carga algo de cdnjs')
write(os.path.join(WEB, 'quincena.js'), body.strip().replace(BRAND_Q, BRAND_I) + '\n')
loader = ('<script src="ikigai/vendor/supabase.js"></script>\n<script src="ikigai/config.js"></script>\n'
          '<script src="ikigai/core.js"></script>\n<script src="quincena.js"></script>')
html = html[:start] + loader + html[end:]
leftover = re.findall(r'<script>(.*?)</script>', html, re.S)
if leftover: sys.exit('Quedaron scripts en línea: %d' % len(leftover))
if re.search(r'\son[a-z]+\s*=\s*["\']', html): sys.exit('Hay manejadores en línea (onclick=…): la CSP los bloquearía')

# 2. Fuentes locales en vez de Google Fonts (funciona sin internet)
html = re.sub(r'<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\s*', '', html)

# 3. Título y cabecera
html = re.sub(r'<title>.*?</title>', '<title>Ikigai</title>', html, count=1, flags=re.S).replace(BRAND_Q, BRAND_I)
csp = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
       "font-src 'self'; connect-src 'self' https://%s wss://%s ipc: http://ipc.localhost; worker-src 'self'; "
       "manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" % (host, host))
head = ('<meta http-equiv="Content-Security-Policy" content="%s">\n'
        '<meta name="referrer" content="no-referrer">\n<meta name="theme-color" content="#0f2e33">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icons/favicon-64.png">\n'
        '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
        '<link rel="stylesheet" href="fonts/fonts.css">\n<link rel="stylesheet" href="ikigai/ikigai.css">\n' % csp)
m = re.search(r'<meta charset=[^>]*>', html, re.I)
if not m: sys.exit('No encontré <meta charset>')
html = html[:m.end()] + '\n' + head + html[m.end():]
write(os.path.join(WEB, 'index.html'), html)

# 4. Entreno sin la sección "Llevar a la app local"
ent = read(os.path.join(SRC, 'entreno.js'))
ent, n = re.subn(r'\n\s*<section class="panel stack"><h2>Llevar a la app local</h2>.*?</section>', '', ent, flags=re.S)
ent = ent.replace("if(!F.demo) prefetchCode();", "").replace('<span class="brand-mark">8·S</span><span class="brand-name">Entreno</span>', BRAND_I)
write(os.path.join(WEB, 'entreno.js'), ent)

# 4b. Estilo (biblioteca de ropa, muñeco y guía) tal cual
write(os.path.join(WEB, 'estilo.js'), read(os.path.join(SRC, 'estilo.js')))

# 5. Service worker con todos los archivos y una versión por contenido
files, h = [], hashlib.sha256()
for d, _, fs in os.walk(WEB):
    for f in sorted(fs):
        p = os.path.relpath(os.path.join(d, f), WEB).replace(os.sep, '/')
        if p == 'sw.js': continue
        files.append('./' + p); h.update(p.encode()); h.update(open(os.path.join(d, f), 'rb').read())
files = sorted(files) + ['./']
sw = read(os.path.join(ROOT, 'tools', 'sw.template.js')).replace('__BUILD__', h.hexdigest()[:12]).replace('__FILES__', json.dumps(files))
write(os.path.join(WEB, 'sw.js'), sw)
print('web/ listo: %d archivos, quincena.js %d KB, sección de exportación quitada: %s' % (len(files), os.path.getsize(os.path.join(WEB, 'quincena.js')) // 1024, bool(n)))
