# Virtual Drive Mapper

Aplicación de escritorio para Windows para mapear carpetas locales como unidades virtuales.

## Instalación

1. Descargá `virtual-drive-mapper-1.0.3-setup.exe` desde la sección Releases del repositorio.
2. Ejecutá el instalador.
3. Segu&iacute; el asistente de instalación.
4. Abrí la app desde el acceso directo creado o desde el menú Inicio.

## Uso

- Elegí una letra de unidad.
- Seleccioná la ruta destino de una carpeta local.
- Definí un nombre descriptivo.
- Guardá el mapeo.
- Activá `Auto-Inicio` si querés que se reconecte al iniciar Windows.

## Build local

Si querés generar el instalador en tu máquina:

```bash
npm install
npm run build:win
```

Artefactos generados:

- `dist/virtual-drive-mapper-1.0.3-setup.exe`
- `dist/win-unpacked/VirtualDriveMapper.exe`

## Comportamiento

- `Conectar` crea el mapeo con `subst`
- `Desconectar` quita la unidad temporalmente
- `Eliminar` borra el mapeo persistido y desconecta si está activo
- `Auto-Inicio` registra la app en `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- Al iniciar con `--hidden`, la app restaura automáticamente los mapeos guardados

## Alcance

La app está enfocada exclusivamente en carpetas locales.

No incluye integración cloud directa.
