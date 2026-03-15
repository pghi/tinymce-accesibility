<?php
/**
 * Plugin Name: TinyMCE Accessibility Enhancer
 * Plugin URI: https://github.com/pghi/TinyMCE---Accesibilidad-
 * Description: Mejora la accesibilidad del editor TinyMCE en WordPress. Incluye validación de encabezados, texto alternativo obligatorio, verificación de contraste, mejoras ARIA y panel de auditoría.
 * Version: 1.0.0
 * Author: pghi
 * License: GPL-2.0+
 * Text Domain: tinymce-a11y
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.9
 * Requires PHP: 7.2
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TINYMCE_A11Y_VERSION', '1.0.0' );
define( 'TINYMCE_A11Y_PATH', plugin_dir_path( __FILE__ ) );
define( 'TINYMCE_A11Y_URL', plugin_dir_url( __FILE__ ) );

/**
 * Main plugin class.
 */
class TinyMCE_Accessibility {

	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
		add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );

		// Only register TinyMCE hooks if the classic editor is available.
		if ( $this->is_classic_editor_active() ) {
			add_filter( 'mce_external_plugins', array( $this, 'register_tinymce_plugin' ) );
			add_filter( 'mce_buttons_2', array( $this, 'add_toolbar_button' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
			add_filter( 'tiny_mce_before_init', array( $this, 'configure_tinymce' ) );
		}
	}

	/**
	 * Check if the classic TinyMCE editor is active.
	 *
	 * Returns true if:
	 * - WordPress < 5.0 (always had TinyMCE)
	 * - Classic Editor plugin is active
	 * - The block editor has been disabled via filter
	 */
	private function is_classic_editor_active() {
		// WordPress < 5.0 always uses TinyMCE.
		global $wp_version;
		if ( version_compare( $wp_version, '5.0', '<' ) ) {
			return true;
		}

		// Classic Editor plugin is active.
		if ( class_exists( 'Classic_Editor' ) ) {
			return true;
		}

		// Block editor disabled via filter.
		if ( has_filter( 'use_block_editor_for_post_type', '__return_false' ) ) {
			return true;
		}

		// TinyMCE filters are still fired even in Gutenberg for Classic blocks,
		// so we register anyway and let WordPress handle it.
		return true;
	}

	/**
	 * Load plugin translations.
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'tinymce-a11y', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	}

	/**
	 * Register plugin settings.
	 */
	public function register_settings() {
		register_setting( 'tinymce_a11y_options', 'tinymce_a11y_settings', array(
			'type'              => 'array',
			'sanitize_callback' => array( $this, 'sanitize_settings' ),
			'default'           => $this->get_default_settings(),
		) );
	}

	/**
	 * Get default plugin settings.
	 */
	public function get_default_settings() {
		return array(
			'enforce_alt_text'     => true,
			'check_heading_order'  => true,
			'check_contrast'       => true,
			'enhance_aria'         => true,
			'show_audit_panel'     => true,
			'min_contrast_ratio'   => 4.5,
			'prevent_empty_links'  => true,
			'check_link_text'      => true,
		);
	}

	/**
	 * Sanitize settings on save.
	 */
	public function sanitize_settings( $input ) {
		$sanitized = array();
		$sanitized['enforce_alt_text']    = ! empty( $input['enforce_alt_text'] );
		$sanitized['check_heading_order'] = ! empty( $input['check_heading_order'] );
		$sanitized['check_contrast']      = ! empty( $input['check_contrast'] );
		$sanitized['enhance_aria']        = ! empty( $input['enhance_aria'] );
		$sanitized['show_audit_panel']    = ! empty( $input['show_audit_panel'] );
		$sanitized['prevent_empty_links'] = ! empty( $input['prevent_empty_links'] );
		$sanitized['check_link_text']     = ! empty( $input['check_link_text'] );
		$sanitized['min_contrast_ratio']  = floatval( $input['min_contrast_ratio'] );

		if ( $sanitized['min_contrast_ratio'] < 3.0 ) {
			$sanitized['min_contrast_ratio'] = 3.0;
		}
		if ( $sanitized['min_contrast_ratio'] > 7.0 ) {
			$sanitized['min_contrast_ratio'] = 7.0;
		}

		return $sanitized;
	}

	/**
	 * Add settings page to admin menu.
	 */
	public function add_settings_page() {
		add_options_page(
			__( 'TinyMCE Accessibility', 'tinymce-a11y' ),
			__( 'Accesibilidad TinyMCE', 'tinymce-a11y' ),
			'manage_options',
			'tinymce-a11y',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Render the settings page.
	 */
	public function render_settings_page() {
		$settings = wp_parse_args(
			get_option( 'tinymce_a11y_settings', array() ),
			$this->get_default_settings()
		);
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'TinyMCE Accessibility Enhancer', 'tinymce-a11y' ); ?></h1>
			<form method="post" action="options.php">
				<?php settings_fields( 'tinymce_a11y_options' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><?php esc_html_e( 'Texto alternativo obligatorio', 'tinymce-a11y' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="tinymce_a11y_settings[enforce_alt_text]" value="1" <?php checked( $settings['enforce_alt_text'] ); ?> />
								<?php esc_html_e( 'Exigir texto alternativo en todas las imágenes', 'tinymce-a11y' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Orden de encabezados', 'tinymce-a11y' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="tinymce_a11y_settings[check_heading_order]" value="1" <?php checked( $settings['check_heading_order'] ); ?> />
								<?php esc_html_e( 'Verificar que los encabezados sigan un orden jerárquico correcto', 'tinymce-a11y' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Contraste de color', 'tinymce-a11y' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="tinymce_a11y_settings[check_contrast]" value="1" <?php checked( $settings['check_contrast'] ); ?> />
								<?php esc_html_e( 'Verificar el contraste de color del texto', 'tinymce-a11y' ); ?>
							</label>
							<br />
							<label>
								<?php esc_html_e( 'Ratio mínimo de contraste:', 'tinymce-a11y' ); ?>
								<input type="number" name="tinymce_a11y_settings[min_contrast_ratio]" value="<?php echo esc_attr( $settings['min_contrast_ratio'] ); ?>" min="3" max="7" step="0.1" style="width:70px" />
								<span class="description"><?php esc_html_e( '(WCAG AA = 4.5, WCAG AAA = 7.0)', 'tinymce-a11y' ); ?></span>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Mejoras ARIA', 'tinymce-a11y' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="tinymce_a11y_settings[enhance_aria]" value="1" <?php checked( $settings['enhance_aria'] ); ?> />
								<?php esc_html_e( 'Añadir roles y etiquetas ARIA a la barra de herramientas', 'tinymce-a11y' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Panel de auditoría', 'tinymce-a11y' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="tinymce_a11y_settings[show_audit_panel]" value="1" <?php checked( $settings['show_audit_panel'] ); ?> />
								<?php esc_html_e( 'Mostrar panel de auditoría de accesibilidad en el editor', 'tinymce-a11y' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Enlaces', 'tinymce-a11y' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="tinymce_a11y_settings[prevent_empty_links]" value="1" <?php checked( $settings['prevent_empty_links'] ); ?> />
								<?php esc_html_e( 'Prevenir enlaces vacíos o sin texto descriptivo', 'tinymce-a11y' ); ?>
							</label>
							<br />
							<label>
								<input type="checkbox" name="tinymce_a11y_settings[check_link_text]" value="1" <?php checked( $settings['check_link_text'] ); ?> />
								<?php esc_html_e( 'Advertir sobre textos de enlace genéricos ("clic aquí", "leer más")', 'tinymce-a11y' ); ?>
							</label>
						</td>
					</tr>
				</table>
				<?php submit_button( __( 'Guardar cambios', 'tinymce-a11y' ) ); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Register the TinyMCE plugin JS.
	 */
	public function register_tinymce_plugin( $plugins ) {
		$plugins['a11y_checker'] = TINYMCE_A11Y_URL . 'assets/js/tinymce-a11y-plugin.js';
		return $plugins;
	}

	/**
	 * Add the accessibility audit button to TinyMCE toolbar.
	 */
	public function add_toolbar_button( $buttons ) {
		$buttons[] = 'a11y_audit';
		return $buttons;
	}

	/**
	 * Pass plugin settings to TinyMCE.
	 */
	public function configure_tinymce( $settings ) {
		$plugin_settings = wp_parse_args(
			get_option( 'tinymce_a11y_settings', array() ),
			$this->get_default_settings()
		);

		$settings['a11y_settings'] = wp_json_encode( $plugin_settings );
		return $settings;
	}

	/**
	 * Enqueue admin CSS and JS for the audit panel.
	 */
	public function enqueue_admin_assets( $hook ) {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		wp_enqueue_style(
			'tinymce-a11y-admin',
			TINYMCE_A11Y_URL . 'assets/css/admin.css',
			array(),
			TINYMCE_A11Y_VERSION
		);

		wp_enqueue_script(
			'tinymce-a11y-audit-panel',
			TINYMCE_A11Y_URL . 'assets/js/audit-panel.js',
			array( 'jquery' ),
			TINYMCE_A11Y_VERSION,
			true
		);

		$settings = wp_parse_args(
			get_option( 'tinymce_a11y_settings', array() ),
			$this->get_default_settings()
		);

		wp_localize_script( 'tinymce-a11y-audit-panel', 'tinymceA11y', array(
			'settings' => $settings,
			'i18n'     => array(
				'panelTitle'        => __( 'Auditoría de Accesibilidad', 'tinymce-a11y' ),
				'noIssues'          => __( 'No se encontraron problemas de accesibilidad.', 'tinymce-a11y' ),
				'issuesFound'       => __( 'problemas encontrados', 'tinymce-a11y' ),
				'runAudit'          => __( 'Ejecutar auditoría', 'tinymce-a11y' ),
				'headingOrder'      => __( 'Orden de encabezados', 'tinymce-a11y' ),
				'missingAlt'        => __( 'Texto alternativo faltante', 'tinymce-a11y' ),
				'lowContrast'       => __( 'Contraste insuficiente', 'tinymce-a11y' ),
				'emptyLink'         => __( 'Enlace vacío', 'tinymce-a11y' ),
				'genericLinkText'   => __( 'Texto de enlace genérico', 'tinymce-a11y' ),
				'error'             => __( 'Error', 'tinymce-a11y' ),
				'warning'           => __( 'Advertencia', 'tinymce-a11y' ),
				'passed'            => __( 'Correcto', 'tinymce-a11y' ),
				'headingSkipped'    => __( 'Se saltó del nivel H%1$s al H%2$s. Use niveles consecutivos.', 'tinymce-a11y' ),
				'imgNoAlt'          => __( 'Imagen sin texto alternativo.', 'tinymce-a11y' ),
				'imgEmptyAlt'       => __( 'Imagen con texto alternativo vacío. Si es decorativa, considere eliminarla del contenido.', 'tinymce-a11y' ),
				'contrastFail'      => __( 'El ratio de contraste (%1$s) es menor que el mínimo requerido (%2$s).', 'tinymce-a11y' ),
				'linkEmpty'         => __( 'Este enlace no tiene texto descriptivo.', 'tinymce-a11y' ),
				'linkGeneric'       => __( 'Evite textos de enlace genéricos como "%s". Use texto descriptivo.', 'tinymce-a11y' ),
			),
		) );
	}
}

TinyMCE_Accessibility::get_instance();
