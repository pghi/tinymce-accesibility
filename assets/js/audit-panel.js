/**
 * Accessibility Audit Panel
 *
 * Renders a collapsible panel below the TinyMCE editor showing
 * real-time accessibility audit results.
 */
(function ($) {
	'use strict';

	if (typeof tinymceA11y === 'undefined') {
		return;
	}

	var i18n = tinymceA11y.i18n;
	var panelCreated = false;

	/**
	 * Build the audit panel DOM and insert it after the editor.
	 */
	function createPanel() {
		if (panelCreated) return;

		var editorWrap = document.getElementById('wp-content-editor-container');
		if (!editorWrap) {
			editorWrap = document.getElementById('wp-content-wrap');
		}
		if (!editorWrap) return;

		var panel = document.createElement('div');
		panel.id = 'a11y-audit-panel';
		panel.className = 'a11y-audit-panel';
		panel.setAttribute('role', 'region');
		panel.setAttribute('aria-label', i18n.panelTitle);

		panel.innerHTML =
			'<div class="a11y-audit-header" role="button" tabindex="0" aria-expanded="true" aria-controls="a11y-audit-body">' +
				'<span class="a11y-audit-icon" aria-hidden="true">&#9881;</span> ' +
				'<span class="a11y-audit-title">' + escapeHtml(i18n.panelTitle) + '</span>' +
				'<span class="a11y-audit-badge" id="a11y-badge" aria-live="polite">0 ' + escapeHtml(i18n.issuesFound) + '</span>' +
				'<span class="a11y-audit-toggle" aria-hidden="true">&#9660;</span>' +
			'</div>' +
			'<div class="a11y-audit-body" id="a11y-audit-body">' +
				'<div class="a11y-audit-summary" id="a11y-audit-summary">' +
					'<p class="a11y-no-issues">' + escapeHtml(i18n.noIssues) + '</p>' +
				'</div>' +
				'<ul class="a11y-audit-list" id="a11y-audit-list" role="list" aria-label="' + escapeHtml(i18n.panelTitle) + '"></ul>' +
			'</div>';

		editorWrap.parentNode.insertBefore(panel, editorWrap.nextSibling);

		// Toggle panel
		var header = panel.querySelector('.a11y-audit-header');
		header.addEventListener('click', togglePanel);
		header.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				togglePanel();
			}
		});

		panelCreated = true;
	}

	function togglePanel() {
		var header = document.querySelector('.a11y-audit-header');
		var body = document.getElementById('a11y-audit-body');
		if (!header || !body) return;

		var expanded = header.getAttribute('aria-expanded') === 'true';
		header.setAttribute('aria-expanded', !expanded);
		body.style.display = expanded ? 'none' : 'block';

		var toggle = header.querySelector('.a11y-audit-toggle');
		if (toggle) {
			toggle.innerHTML = expanded ? '&#9654;' : '&#9660;';
		}
	}

	/**
	 * Update the audit panel with new results.
	 */
	function updatePanel(detail) {
		var badge = document.getElementById('a11y-badge');
		var summary = document.getElementById('a11y-audit-summary');
		var list = document.getElementById('a11y-audit-list');

		if (!badge || !summary || !list) return;

		var total = detail.total || 0;
		var errors = detail.errors || 0;
		var warnings = detail.warnings || 0;
		var issues = detail.issues || [];

		// Update badge
		badge.textContent = total + ' ' + i18n.issuesFound;
		badge.className = 'a11y-audit-badge';
		if (errors > 0) {
			badge.classList.add('a11y-badge-error');
		} else if (warnings > 0) {
			badge.classList.add('a11y-badge-warning');
		} else {
			badge.classList.add('a11y-badge-success');
		}

		// Update summary
		if (total === 0) {
			summary.innerHTML = '<p class="a11y-no-issues a11y-success">' + escapeHtml(i18n.noIssues) + '</p>';
		} else {
			summary.innerHTML =
				'<p class="a11y-issue-count">' +
					'<span class="a11y-error-count">' + errors + ' ' + escapeHtml(i18n.error) + '</span> &middot; ' +
					'<span class="a11y-warning-count">' + warnings + ' ' + escapeHtml(i18n.warning) + '</span>' +
				'</p>';
		}

		// Update issue list
		list.innerHTML = '';
		for (var i = 0; i < issues.length; i++) {
			var issue = issues[i];
			var li = document.createElement('li');
			li.className = 'a11y-issue-item a11y-issue-' + issue.type;
			li.setAttribute('role', 'listitem');

			var icon = issue.type === 'error' ? '&#10060;' : '&#9888;';
			var categoryLabel = getCategoryLabel(issue.category);

			li.innerHTML =
				'<span class="a11y-issue-icon" aria-hidden="true">' + icon + '</span>' +
				'<span class="a11y-issue-category">' + escapeHtml(categoryLabel) + '</span>' +
				'<span class="a11y-issue-message">' + escapeHtml(issue.message) + '</span>' +
				(issue.text ? '<span class="a11y-issue-context">' + escapeHtml(issue.text) + '</span>' : '');

			list.appendChild(li);
		}
	}

	function getCategoryLabel(category) {
		var labels = {
			'heading_order': i18n.headingOrder,
			'missing_alt': i18n.missingAlt,
			'empty_alt': i18n.missingAlt,
			'low_contrast': i18n.lowContrast,
			'empty_link': i18n.emptyLink,
			'generic_link': i18n.genericLinkText
		};
		return labels[category] || category;
	}

	function escapeHtml(str) {
		var div = document.createElement('div');
		div.appendChild(document.createTextNode(str));
		return div.innerHTML;
	}

	// ──────────────────────────────────────────
	// Event listeners
	// ──────────────────────────────────────────

	window.addEventListener('tinymce-a11y-audit', function (e) {
		createPanel();
		updatePanel(e.detail);
	});

	// Create panel on editor init
	$(document).on('tinymce-editor-init', function () {
		if (tinymceA11y.settings.show_audit_panel) {
			createPanel();
		}
	});

	// Fallback: create panel after a short delay
	$(function () {
		if (tinymceA11y.settings.show_audit_panel) {
			setTimeout(createPanel, 2000);
		}
	});

})(jQuery);
