# TinyMCE Accessibility Enhancer

Plugin de WordPress que mejora la accesibilidad del editor clásico TinyMCE, ayudando a los autores a crear contenido conforme a las pautas WCAG 2.1.

## Funcionalidades

### Validación de estructura de encabezados
Detecta cuando los niveles de encabezado se saltan (por ejemplo, de H2 a H4) y alerta al autor para mantener una jerarquía correcta.

### Texto alternativo obligatorio en imágenes
Resalta las imágenes insertadas sin texto alternativo y muestra una advertencia para que el autor añada una descripción.

### Verificación de contraste de color
Analiza el texto con colores personalizados y verifica que cumple con el ratio mínimo de contraste (configurable: WCAG AA = 4.5:1, AAA = 7.0:1).

### Detección de enlaces problemáticos
- Identifica enlaces vacíos (sin texto ni aria-label)
- Advierte sobre textos de enlace genéricos ("clic aquí", "leer más", etc.)

### Mejoras ARIA en la barra de herramientas
- Añade `role="toolbar"` y `aria-label` a las barras de herramientas
- Mejora la navegación por teclado con teclas de flecha
- Añade etiquetas accesibles al iframe del editor

### Panel de auditoría integrado
Panel desplegable debajo del editor que muestra los resultados de la auditoría en tiempo real con conteo de errores y advertencias.

## Instalación

1. Descarga o clona este repositorio en `/wp-content/plugins/tinymce-accessibility/`
2. Activa el plugin desde **Plugins** en el panel de WordPress
3. Configura las opciones en **Ajustes > Accesibilidad TinyMCE**

## Configuración

Todas las funcionalidades se pueden activar/desactivar individualmente desde la página de ajustes:

| Opción | Descripción | Por defecto |
|--------|-------------|-------------|
| Texto alternativo obligatorio | Exigir alt en imágenes | Activado |
| Orden de encabezados | Verificar jerarquía H1-H6 | Activado |
| Contraste de color | Verificar ratio de contraste | Activado |
| Mejoras ARIA | Roles y etiquetas en toolbar | Activado |
| Panel de auditoría | Mostrar panel de resultados | Activado |
| Prevenir enlaces vacíos | Detectar enlaces sin texto | Activado |
| Textos de enlace genéricos | Advertir sobre "clic aquí" | Activado |
| Ratio mínimo de contraste | Valor mínimo (3.0-7.0) | 4.5 |

## Compatibilidad

| Componente | Versión soportada | Notas |
|-----------|-------------------|-------|
| WordPress | 5.0 – 6.9 | Probado con 6.9, compatible con 7.0 beta |
| TinyMCE   | 4.9.x (bundled)   | La versión incluida en WordPress core |
| PHP       | 7.2+              | |
| Classic Editor plugin | 1.0+ | Recomendado en WP 5.0+ |

### Notas de compatibilidad

- **WordPress usa TinyMCE 4.9.x** — este plugin utiliza la API de TinyMCE 4.x (`editor.addButton`, `editor.settings`, clases CSS `.mce-*`), que es la que WordPress incluye.
- **Gutenberg / Block Editor** — el plugin funciona en bloques "Classic Paragraph" (del plugin Advanced Editor Tools) y con el plugin Classic Editor. No afecta al editor de bloques nativo.
- **TinyMCE 5/6/7/8** — si WordPress algún día actualiza a TinyMCE 5+, las APIs cambiarían (`editor.ui.registry.addButton` en vez de `editor.addButton`, `onAction` en vez de `onclick`). Se actualizará en ese momento.

## Requisitos

- WordPress 5.0+ (recomendado 6.8+)
- PHP 7.2+
- Editor clásico de TinyMCE (Classic Editor plugin o bloques Classic Paragraph)

## Licencia

GPL-2.0+
