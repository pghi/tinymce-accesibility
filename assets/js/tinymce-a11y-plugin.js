/**
 * TinyMCE Accessibility Plugin
 *
 * Integrates accessibility checks directly into the TinyMCE editor:
 * - Heading order validation
 * - Alt text enforcement for images
 * - Color contrast checking
 * - Empty/generic link detection
 * - ARIA enhancements for the toolbar
 */
(function () {
	'use strict';

	tinymce.PluginManager.add('a11y_checker', function (editor) {

		var settings = {};
		try {
			settings = JSON.parse(editor.settings.a11y_settings || '{}');
		} catch (e) {
			settings = {};
		}

		// ──────────────────────────────────────────
		// Color contrast utilities
		// ──────────────────────────────────────────

		function parseColor(colorStr) {
			if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit') {
				return null;
			}

			var match;

			// rgb(r, g, b) or rgba(r, g, b, a)
			match = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
			if (match) {
				return { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
			}

			// #RRGGBB or #RGB
			match = colorStr.match(/^#([0-9a-f]{3,6})$/i);
			if (match) {
				var hex = match[1];
				if (hex.length === 3) {
					hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
				}
				return {
					r: parseInt(hex.substring(0, 2), 16),
					g: parseInt(hex.substring(2, 4), 16),
					b: parseInt(hex.substring(4, 6), 16)
				};
			}

			return null;
		}

		function relativeLuminance(rgb) {
			var sR = rgb.r / 255;
			var sG = rgb.g / 255;
			var sB = rgb.b / 255;

			var r = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
			var g = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
			var b = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);

			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		}

		function contrastRatio(color1, color2) {
			var l1 = relativeLuminance(color1);
			var l2 = relativeLuminance(color2);
			var lighter = Math.max(l1, l2);
			var darker = Math.min(l1, l2);
			return (lighter + 0.05) / (darker + 0.05);
		}

		// ──────────────────────────────────────────
		// Accessibility checks
		// ──────────────────────────────────────────

		function checkHeadingOrder(body) {
			var issues = [];
			if (!settings.check_heading_order) {
				return issues;
			}

			var headings = body.querySelectorAll('h1, h2, h3, h4, h5, h6');
			var lastLevel = 0;

			for (var i = 0; i < headings.length; i++) {
				var level = parseInt(headings[i].tagName.substring(1), 10);
				if (lastLevel > 0 && level > lastLevel + 1) {
					issues.push({
						type: 'error',
						category: 'heading_order',
						element: headings[i],
						message: 'Skipped from H' + lastLevel + ' to H' + level + '. Use consecutive heading levels.'
					});
				}
				lastLevel = level;
			}

			return issues;
		}

		function checkAltText(body) {
			var issues = [];
			if (!settings.enforce_alt_text) {
				return issues;
			}

			var images = body.querySelectorAll('img');
			for (var i = 0; i < images.length; i++) {
				var alt = images[i].getAttribute('alt');
				if (alt === null) {
					issues.push({
						type: 'error',
						category: 'missing_alt',
						element: images[i],
						message: 'Image is missing alt text.'
					});
				} else if (alt.trim() === '') {
					issues.push({
						type: 'warning',
						category: 'empty_alt',
						element: images[i],
						message: 'Image has empty alt text. If decorative, consider removing it from content.'
					});
				}
			}

			return issues;
		}

		function checkContrast(body) {
			var issues = [];
			if (!settings.check_contrast) {
				return issues;
			}

			var minRatio = settings.min_contrast_ratio || 4.5;
			var elements = body.querySelectorAll('[style*="color"]');

			for (var i = 0; i < elements.length; i++) {
				var el = elements[i];
				var style = el.getAttribute('style') || '';

				// Extract foreground color
				var fgMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
				if (!fgMatch) continue;

				var fgColor = parseColor(fgMatch[1].trim());
				if (!fgColor) continue;

				// Try to get background color, default to white
				var bgMatch = style.match(/background-color\s*:\s*([^;]+)/i);
				var bgColor = bgMatch ? parseColor(bgMatch[1].trim()) : { r: 255, g: 255, b: 255 };
				if (!bgColor) bgColor = { r: 255, g: 255, b: 255 };

				var ratio = contrastRatio(fgColor, bgColor);
				if (ratio < minRatio) {
					issues.push({
						type: 'error',
						category: 'low_contrast',
						element: el,
						message: 'Contrast ratio (' + ratio.toFixed(2) + ':1) is below the required minimum (' + minRatio + ':1).'
					});
				}
			}

			return issues;
		}

		function checkLinks(body) {
			var issues = [];
			var links = body.querySelectorAll('a');
			var genericTexts = [
				'click here', 'here', 'read more', 'more',
				'link', 'this', 'learn more', 'go', 'details',
				'info', 'this link', 'this page'
			];

			for (var i = 0; i < links.length; i++) {
				var link = links[i];
				var text = (link.textContent || '').trim();
				var ariaLabel = link.getAttribute('aria-label');

				if (settings.prevent_empty_links && !text && !ariaLabel && !link.querySelector('img[alt]')) {
					issues.push({
						type: 'error',
						category: 'empty_link',
						element: link,
						message: 'This link has no descriptive text.'
					});
				} else if (settings.check_link_text && text) {
					var lowerText = text.toLowerCase();
					for (var j = 0; j < genericTexts.length; j++) {
						if (lowerText === genericTexts[j]) {
							issues.push({
								type: 'warning',
								category: 'generic_link',
								element: link,
								message: 'Avoid generic link text like "' + text + '". Use descriptive text instead.'
							});
							break;
						}
					}
				}
			}

			return issues;
		}

		/**
		 * Run all accessibility checks and return combined issues.
		 */
		function runAllChecks() {
			var body = editor.getBody();
			var issues = [];

			issues = issues.concat(checkHeadingOrder(body));
			issues = issues.concat(checkAltText(body));
			issues = issues.concat(checkContrast(body));
			issues = issues.concat(checkLinks(body));

			return issues;
		}

		// ──────────────────────────────────────────
		// Visual indicators inside editor
		// ──────────────────────────────────────────

		function clearHighlights() {
			var body = editor.getBody();
			var highlighted = body.querySelectorAll('[data-a11y-issue]');
			for (var i = 0; i < highlighted.length; i++) {
				highlighted[i].removeAttribute('data-a11y-issue');
				highlighted[i].style.outline = '';
				highlighted[i].style.outlineOffset = '';
			}
		}

		function highlightIssues(issues) {
			clearHighlights();
			for (var i = 0; i < issues.length; i++) {
				var el = issues[i].element;
				if (el) {
					el.setAttribute('data-a11y-issue', issues[i].type);
					if (issues[i].type === 'error') {
						el.style.outline = '3px solid #e74c3c';
						el.style.outlineOffset = '2px';
					} else {
						el.style.outline = '3px solid #f39c12';
						el.style.outlineOffset = '2px';
					}
				}
			}
		}

		// ──────────────────────────────────────────
		// Image insertion: enforce alt text
		// ──────────────────────────────────────────

		if (settings.enforce_alt_text) {
			editor.on('BeforeSetContent', function (e) {
				// Check for img tags without alt in pasted/inserted HTML
				if (e.content && e.content.indexOf('<img') !== -1) {
					var div = document.createElement('div');
					div.innerHTML = e.content;
					var imgs = div.querySelectorAll('img:not([alt])');
					for (var i = 0; i < imgs.length; i++) {
						imgs[i].setAttribute('alt', '');
						imgs[i].setAttribute('data-needs-alt', 'true');
					}
					e.content = div.innerHTML;
				}
			});

			editor.on('SetContent', function () {
				var body = editor.getBody();
				var needsAlt = body.querySelectorAll('img[data-needs-alt]');
				if (needsAlt.length > 0) {
					for (var i = 0; i < needsAlt.length; i++) {
						needsAlt[i].removeAttribute('data-needs-alt');
						needsAlt[i].style.outline = '3px solid #e74c3c';
						needsAlt[i].style.outlineOffset = '2px';
					}
					editor.notificationManager.open({
						text: 'Images were inserted without alt text. Please add a description.',
						type: 'warning',
						timeout: 5000
					});
				}
			});
		}

		// ──────────────────────────────────────────
		// ARIA toolbar enhancements
		// ──────────────────────────────────────────

		if (settings.enhance_aria) {
			editor.on('init', function () {
				var container = editor.getContainer();
				if (!container) return;

				// Add aria-label to the editor iframe
				var iframe = container.querySelector('iframe');
				if (iframe) {
					iframe.setAttribute('aria-label', 'Content editing area');
					iframe.setAttribute('title', 'Accessible content editor');
				}

				// Enhance toolbar buttons
				var toolbarButtons = container.querySelectorAll('.mce-btn');
				for (var i = 0; i < toolbarButtons.length; i++) {
					var btn = toolbarButtons[i];
					if (!btn.getAttribute('aria-label')) {
						var title = btn.getAttribute('title') || btn.textContent;
						if (title) {
							btn.setAttribute('aria-label', title.trim());
						}
					}
				}

				// Add role="toolbar" to toolbar containers
				var toolbars = container.querySelectorAll('.mce-toolbar');
				for (var j = 0; j < toolbars.length; j++) {
					toolbars[j].setAttribute('role', 'toolbar');
					if (!toolbars[j].getAttribute('aria-label')) {
						toolbars[j].setAttribute('aria-label', 'Editor toolbar ' + (j + 1));
					}
				}

				// Add keyboard navigation between toolbars
				var allToolbars = container.querySelectorAll('.mce-toolbar');
				for (var k = 0; k < allToolbars.length; k++) {
					(function(toolbar, index) {
						toolbar.addEventListener('keydown', function(e) {
							// Alt+F10 moves to toolbar (standard TinyMCE shortcut)
							// Arrow keys navigate between buttons
							if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
								var buttons = toolbar.querySelectorAll('.mce-btn:not([disabled])');
								var current = toolbar.querySelector('.mce-btn:focus');
								if (!current || buttons.length === 0) return;

								var idx = Array.prototype.indexOf.call(buttons, current);
								if (e.key === 'ArrowRight') {
									idx = (idx + 1) % buttons.length;
								} else {
									idx = (idx - 1 + buttons.length) % buttons.length;
								}
								buttons[idx].focus();
								e.preventDefault();
							}
						});
					})(allToolbars[k], k);
				}
			});
		}

		// ──────────────────────────────────────────
		// Toolbar button: run audit
		// ──────────────────────────────────────────

		editor.addButton('a11y_audit', {
			title: 'Accessibility Audit',
			icon: 'accessibility-check',
			onclick: function () {
				var issues = runAllChecks();
				highlightIssues(issues);

				// Dispatch event for the external audit panel
				var event = new CustomEvent('tinymce-a11y-audit', {
					detail: {
						issues: issues.map(function (issue) {
							return {
								type: issue.type,
								category: issue.category,
								message: issue.message,
								tagName: issue.element ? issue.element.tagName : '',
								text: issue.element ? (issue.element.textContent || '').substring(0, 50) : ''
							};
						}),
						total: issues.length,
						errors: issues.filter(function (i) { return i.type === 'error'; }).length,
						warnings: issues.filter(function (i) { return i.type === 'warning'; }).length
					}
				});
				window.dispatchEvent(event);

				// Show summary notification
				if (issues.length === 0) {
					editor.notificationManager.open({
						text: 'No accessibility issues found.',
						type: 'success',
						timeout: 3000
					});
				} else {
					var errors = issues.filter(function (i) { return i.type === 'error'; }).length;
					var warnings = issues.filter(function (i) { return i.type === 'warning'; }).length;
					editor.notificationManager.open({
						text: 'Accessibility: ' + errors + ' error(s), ' + warnings + ' warning(s).',
						type: errors > 0 ? 'error' : 'warning',
						timeout: 5000
					});
				}
			}
		});

		// ──────────────────────────────────────────
		// Auto-check on content change (debounced)
		// ──────────────────────────────────────────

		var debounceTimer = null;
		editor.on('Change NodeChange', function () {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(function () {
				var issues = runAllChecks();
				var event = new CustomEvent('tinymce-a11y-audit', {
					detail: {
						issues: issues.map(function (issue) {
							return {
								type: issue.type,
								category: issue.category,
								message: issue.message,
								tagName: issue.element ? issue.element.tagName : '',
								text: issue.element ? (issue.element.textContent || '').substring(0, 50) : ''
							};
						}),
						total: issues.length,
						errors: issues.filter(function (i) { return i.type === 'error'; }).length,
						warnings: issues.filter(function (i) { return i.type === 'warning'; }).length,
						auto: true
					}
				});
				window.dispatchEvent(event);
			}, 1500);
		});

		// Expose for external use
		editor.a11yChecker = {
			runAllChecks: runAllChecks,
			highlightIssues: highlightIssues,
			clearHighlights: clearHighlights
		};
	});
})();
