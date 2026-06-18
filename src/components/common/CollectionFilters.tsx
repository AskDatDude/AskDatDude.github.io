import type { ComponentChildren } from "preact";
import type { FacetOption } from "../../utils/collections";
import "./CollectionFilters.css";

type SortOption<T extends string> = {
  value: T;
  label: string;
};

interface CollectionToolbarProps<T extends string> {
  search: string;
  searchPlaceholder: string;
  sort: T;
  sortOptions: SortOption<T>[];
  filtersOpen: boolean;
  activeFilterCount: number;
  action?: ComponentChildren;
  onSearch: (value: string) => void;
  onSort: (value: T) => void;
  onToggleFilters: () => void;
}

export function CollectionToolbar<T extends string>({
  search,
  searchPlaceholder,
  sort,
  sortOptions,
  filtersOpen,
  activeFilterCount,
  action,
  onSearch,
  onSort,
  onToggleFilters,
}: CollectionToolbarProps<T>) {
  return (
    <div class={`collection-toolbar ${action ? "has-action" : ""}`}>
      <label class="collection-field collection-search">
        <span>Search</span>
        <input
          type="search"
          value={search}
          placeholder={searchPlaceholder}
          onInput={(event) => onSearch(event.currentTarget.value)}
        />
      </label>
      <label class="collection-field collection-sort">
        <span>Sort</span>
        <select
          value={sort}
          onChange={(event) => onSort(event.currentTarget.value as T)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {action && <div class="collection-toolbar-action">{action}</div>}
      <button
        type="button"
        class="collection-filter-toggle"
        aria-expanded={filtersOpen}
        onClick={onToggleFilters}
      >
        Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
      </button>
    </div>
  );
}

type ActiveFilter = {
  key: string;
  label: string;
  onRemove: () => void;
};

export function ActiveFilters({
  filters,
  showClear,
  onClear,
}: {
  filters: ActiveFilter[];
  showClear: boolean;
  onClear: () => void;
}) {
  return (
    <div class="collection-active-filters" aria-live="polite">
      {filters.map((filter) => (
        <button key={filter.key} type="button" onClick={filter.onRemove}>
          {filter.label} <span>×</span>
        </button>
      ))}
      {showClear && (
        <button
          type="button"
          class="collection-clear"
          onClick={onClear}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export function ResultsHeading({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div class="collection-results-heading">
      <span>{label}</span>
      <span>{count.toString().padStart(2, "0")}</span>
    </div>
  );
}

export function FilterSidebar({
  open,
  activeFilterCount,
  children,
}: {
  open: boolean;
  activeFilterCount: number;
  children: ComponentChildren;
}) {
  return (
    <aside class={`collection-filters ${open ? "is-open" : ""}`}>
      <div class="collection-filter-heading">
        <span>Filters</span>
        <span>{activeFilterCount.toString().padStart(2, "0")}</span>
      </div>
      {children}
    </aside>
  );
}

export function FacetGroup({
  title,
  options,
  selected,
  formatValue = (value) => value,
  onToggle,
}: {
  title: string;
  options: FacetOption[];
  selected: string[];
  formatValue?: (value: string) => string;
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset class="collection-facet">
      <legend>{title}</legend>
      {options.map(({ value, count }) => (
        <label key={value}>
          <input
            type="checkbox"
            checked={selected.includes(value)}
            disabled={count === 0 && !selected.includes(value)}
            onChange={() => onToggle(value)}
          />
          <span>{formatValue(value)}</span>
          <span>{count.toString().padStart(2, "0")}</span>
        </label>
      ))}
    </fieldset>
  );
}
