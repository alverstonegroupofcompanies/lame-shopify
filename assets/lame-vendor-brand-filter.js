const VENDOR_FILTER_HIDDEN_CLASS = 'lame-brand-filter--hidden';

/**
 * @param {string} vendor
 * @returns {string}
 */
export function vendorToSlug(vendor) {
  const trimmed = vendor.trim();
  const down = trimmed.toLowerCase();

  if (!trimmed) return 'other';
  if (down.includes('lamstone')) return 'lamstone-healthcare';

  return trimmed
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * @returns {HTMLInputElement[]}
 */
export function getVendorFilterInputs() {
  return [
    ...document.querySelectorAll('[data-lame-vendor-filter] input[type="checkbox"][name="filter.p.vendor"]'),
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
 * @param {HTMLElement} element
 * @param {boolean} hide
 */
function setVendorFilterHidden(element, hide) {
  element.hidden = hide;
  element.classList.toggle(VENDOR_FILTER_HIDDEN_CLASS, hide);
}

/**
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function inputSlug(input) {
  const fromDataset = input.dataset.brandSlug?.trim().toLowerCase();
  if (fromDataset) return fromDataset;
  const fromBrand = input.dataset.brand?.trim();
  if (fromBrand) return vendorToSlug(fromBrand);
  return vendorToSlug(input.value);
}

/**
 * @returns {{ slugs: Set<string>, names: Set<string> }}
 */
export function getSelectedVendorFilters() {
  const slugs = new Set();
  const names = new Set();

  for (const input of getVendorFilterInputs()) {
    if (!input.checked) continue;

    slugs.add(inputSlug(input));

    const brand = input.dataset.brand?.trim().toLowerCase();
    const value = input.value.trim().toLowerCase();
    if (brand) names.add(brand);
    if (value) names.add(value);
  }

  return { slugs, names };
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function slugFamilyMatch(a, b) {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  if (right.startsWith(`${left}-`)) return true;
  if (left.startsWith(`${right}-`)) return true;
  return false;
}

/**
 * @param {string} slug
 * @param {string} brandName
 * @param {{ slugs: Set<string>, names: Set<string> }} selected
 * @returns {boolean}
 */
export function productMatchesVendorFilter(slug, brandName, selected) {
  const slugDown = slug.trim().toLowerCase();
  const brandDown = brandName.trim().toLowerCase();
  const brandSlug = brandDown ? vendorToSlug(brandDown) : '';

  if (selected.slugs.size === 0 && selected.names.size === 0) return true;

  for (const selectedSlug of selected.slugs) {
    if (slugDown && slugFamilyMatch(selectedSlug, slugDown)) return true;
    if (brandSlug && slugFamilyMatch(selectedSlug, brandSlug)) return true;
  }

  if (brandDown && selected.names.has(brandDown)) return true;
  if (brandDown && selected.slugs.has(brandSlug)) return true;

  for (const name of selected.names) {
    const nameSlug = vendorToSlug(name);
    if (name === brandDown) return true;
    if (nameSlug && slugDown && slugFamilyMatch(nameSlug, slugDown)) return true;
    if (nameSlug && brandSlug && slugFamilyMatch(nameSlug, brandSlug)) return true;
    if (brandDown && (brandDown.includes(name) || name.includes(brandDown))) return true;
  }

  return false;
}

/**
 * @param {HTMLElement} productsColumn
 */
export function applyVendorBrandFilter(productsColumn = document.querySelector('.lame-collection-products-column')) {
  if (!(productsColumn instanceof HTMLElement)) return;

  const selected = getSelectedVendorFilters();
  const hasSelection = selected.slugs.size > 0 || selected.names.size > 0;
  let visibleCount = 0;

  productsColumn.querySelectorAll('.lame-collection-brand-section').forEach((section) => {
    if (!(section instanceof HTMLElement)) return;

    const slug = section.dataset.brandSlug ?? '';
    const brand = section.dataset.brand ?? '';
    const show = !hasSelection || productMatchesVendorFilter(slug, brand, selected);
    setVendorFilterHidden(section, !show);
    if (show) {
      visibleCount += section.querySelectorAll('li[data-brand-slug]').length;
    }
  });

  productsColumn.querySelectorAll('li[data-brand-slug], .lame-category-shop__item[data-brand-slug]').forEach((item) => {
    if (!(item instanceof HTMLElement)) return;

    const parentSection = item.closest('.lame-collection-brand-section');
    if (parentSection instanceof HTMLElement && parentSection.classList.contains(VENDOR_FILTER_HIDDEN_CLASS)) return;

    const slug = item.dataset.brandSlug ?? '';
    const brand = item.dataset.brand ?? '';
    const show = !hasSelection || productMatchesVendorFilter(slug, brand, selected);
    setVendorFilterHidden(item, !show);
    if (show) visibleCount += 1;
  });

  if (hasSelection && selected.slugs.size === 1) {
    const [slug] = [...selected.slugs];
    productsColumn.classList.add('lame-collection-products-column--brand-selected');
    productsColumn.setAttribute('data-active-brand', slug);
  } else {
    productsColumn.classList.remove('lame-collection-products-column--brand-selected');
    productsColumn.removeAttribute('data-active-brand');
  }

  const emptyState = productsColumn.querySelector('[data-lame-brand-filter-empty]');
  if (emptyState instanceof HTMLElement) {
    emptyState.hidden = !hasSelection || visibleCount > 0;
  }
}

/**
 * @param {URLSearchParams} [queryParams]
 */
export function syncVendorCheckboxesFromUrl(queryParams) {
  const selectedVendors = queryParams
    ? queryParams.getAll('filter.p.vendor')
    : new URL(window.location.href).searchParams.getAll('filter.p.vendor');

  const selectedNames = new Set(selectedVendors.map((v) => v.trim().toLowerCase()));
  const selectedSlugs = new Set(selectedVendors.map((v) => vendorToSlug(v)));

  for (const input of getVendorFilterInputs()) {
    const slug = inputSlug(input);
    const valueDown = input.value.trim().toLowerCase();
    const brandDown = input.dataset.brand?.trim().toLowerCase() ?? '';

    input.checked =
      selectedNames.has(valueDown) ||
      selectedNames.has(brandDown) ||
      [...selectedSlugs].some((s) => slugFamilyMatch(s, slug)) ||
      [...selectedNames].some((name) => slugFamilyMatch(vendorToSlug(name), slug));
  }
}

/**
 * @param {HTMLInputElement} changedInput
 */
export function syncVendorCheckboxGroup(changedInput) {
  const slug = inputSlug(changedInput);

  for (const input of getVendorFilterInputs()) {
    if (inputSlug(input) === slug) {
      input.checked = changedInput.checked;
    }
  }
}

/**
 * Re-sync vendor UI after section morph or pagination.
 */
export function onSectionMorphComplete() {
  syncVendorCheckboxesFromUrl();
  applyVendorBrandFilter();
}
