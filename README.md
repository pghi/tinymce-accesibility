# TinyMCE Accessibility

WordPress plugin that enhances the accessibility of the classic TinyMCE editor, helping authors create content that complies with WCAG 2.1 guidelines.

## Features

### Heading Structure Validation
Detects when heading levels are skipped (e.g., from H2 to H4) and alerts the author to maintain proper hierarchy.

### Required Alt Text for Images
Highlights images inserted without alt text and displays a warning prompting the author to add a description.

### Color Contrast Checker
Analyzes text with custom colors and verifies it meets the minimum contrast ratio (configurable: WCAG AA = 4.5:1, AAA = 7.0:1).

### Problematic Link Detection
- Identifies empty links (no text or aria-label)
- Warns about generic link text ("click here", "read more", etc.)

### ARIA Toolbar Enhancements
- Adds `role="toolbar"` and `aria-label` to toolbars
- Improves keyboard navigation with arrow keys
- Adds accessible labels to the editor iframe

### Built-in Audit Panel
Collapsible panel below the editor that displays real-time audit results with error and warning counts.

## Installation

1. Download or clone this repository into `/wp-content/plugins/tinymce-accessibility/`
2. Activate the plugin from **Plugins** in the WordPress admin panel
3. Configure options under **Settings > TinyMCE Accessibility**

## Configuration

All features can be individually enabled/disabled from the settings page:

| Option | Description | Default |
|--------|-------------|---------|
| Required alt text | Enforce alt text on images | Enabled |
| Heading order | Verify H1-H6 hierarchy | Enabled |
| Color contrast | Check contrast ratio | Enabled |
| ARIA enhancements | Roles and labels on toolbar | Enabled |
| Audit panel | Show results panel | Enabled |
| Prevent empty links | Detect links without text | Enabled |
| Generic link text | Warn about "click here" | Enabled |
| Minimum contrast ratio | Minimum value (3.0-7.0) | 4.5 |

## Compatibility

| Component | Supported Version | Notes |
|-----------|-------------------|-------|
| WordPress | 5.0 – 6.9 | Tested with 6.9, compatible with 7.0 beta |
| TinyMCE   | 4.9.x (bundled)   | The version included in WordPress core |
| PHP       | 7.2+              | |
| Classic Editor plugin | 1.0+ | Recommended for WP 5.0+ |

### Compatibility Notes

- **WordPress ships TinyMCE 4.9.x** — this plugin uses the TinyMCE 4.x API (`editor.addButton`, `editor.settings`, `.mce-*` CSS classes), which is what WordPress includes.
- **Gutenberg / Block Editor** — the plugin works within "Classic Paragraph" blocks (from the Advanced Editor Tools plugin) and with the Classic Editor plugin. It does not affect the native block editor.
- **TinyMCE 5/6/7/8** — if WordPress ever upgrades to TinyMCE 5+, the APIs would change (`editor.ui.registry.addButton` instead of `editor.addButton`, `onAction` instead of `onclick`). The plugin will be updated accordingly at that time.

## Requirements

- WordPress 5.0+ (6.8+ recommended)
- PHP 7.2+
- Classic TinyMCE editor (Classic Editor plugin or Classic Paragraph blocks)

## License

GPL-2.0+
