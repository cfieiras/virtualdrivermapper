# Virtual Drive Mapper

Aplicación de escritorio para Windows hecha con Electron, React y TypeScript.

Su objetivo es mapear carpetas locales como unidades virtuales usando `subst`, guardar esos mapeos y restaurarlos automáticamente al iniciar Windows.

## Funcionalidades

- Mapear una carpeta local a una letra de unidad
- Desconectar una unidad sin borrar su configuración
- Eliminar un mapeo persistido
- Editar letra, nombre y ruta destino
- Restaurar mapeos al iniciar sesión
- Activar auto-inicio con Windows
- Ver espacio disponible de cada unidad

## Requisitos

- Windows 10 o superior
- Node.js 20 o superior
- npm

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Ejecutar en modo desarrollo:

```bash
npm run dev
```

Validar el proyecto:

```bash
npm run lint
npm run typecheck
```

## Build

Generar instalador de Windows:

```bash
npm run build:win
```

Artefactos generados:

- Instalador: `dist/virtual-drive-mapper-1.0.3-setup.exe`
- Binario unpacked: `dist/win-unpacked/VirtualDriveMapper.exe`

## Instalación

La instalación por defecto deja el desinstalador en:

`C:\Users\<usuario>\AppData\Local\Programs\virtual-drive-mapper\Uninstall Virtual Drive Mapper.exe`

## Comportamiento

- `Conectar` crea el mapeo con `subst`
- `Desconectar` quita la unidad temporalmente
- `Eliminar` borra el mapeo persistido y desconecta si está activo
- `Auto-Inicio` registra la app en `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- Al iniciar con `--hidden`, la app restaura automáticamente los mapeos guardados

## Alcance

La app está enfocada exclusivamente en carpetas locales.

No incluye integración cloud directa.
