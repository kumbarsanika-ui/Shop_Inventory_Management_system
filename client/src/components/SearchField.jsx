import { Search } from 'lucide-react';

export default function SearchField({ value, onChange, placeholder = 'Search', label = 'Search' }) {
  return <label className="search-control"><Search size={16} /><input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}
