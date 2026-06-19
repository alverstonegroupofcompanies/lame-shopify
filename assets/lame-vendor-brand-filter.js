/**
 * Brand filter helpers — server-side filtering only.
 * Syncs vendor checkboxes (desktop + mobile drawer) into the facets URL.
 */

/**
 * @returns {HTMLInputElement[]}
 */
export function getVendorFilterInputs() {
  return [
    ...document.querySelectorAll(
      'facet-inputs-component[data-lame-vendor-filter] input[type="checkbox"][name="filter.p.vendor"]'
    ),
  ].filter((input) => input instanceof HTMLInputElement);
}

/**
 * @param {URLSearchParams} params
 */
export function syncVendorParamsToUrlSearchParams(params) {
  params.delete('filter.p.vendor');

  const added = new Set();

  for (const input of getVendorFilterInputs()) {
    if (!input.checked) continue;

    const value = input.value.trim();
    if (!value || added.has(value)) continue;

    added.add(value);
    params.append('filter.p.vendor', value);
  }
}

/**
 * Keep desktop and drawer brand checkboxes in sync.
 * @param {HTMLInputElement} changedInput
 */
export function syncVendorCheckboxGroup(changedInput) {
  const value = changedInput.value;

  for (const input of getVendorFilterInputs()) {
    if (input.value === value) {
      input.checked = changedInput.checked;
    }
  }
}
