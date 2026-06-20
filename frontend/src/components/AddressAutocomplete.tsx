import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { MapPin } from 'lucide-react';
import { gold } from '../styles/design-tokens';

export interface AddressSelection {
  street: string;
  city: string;
  postalCode: string;
}

interface AddressAutocompleteProps {
  lang: 'fr' | 'en';
  onSelect: (value: AddressSelection) => void;
}

export function AddressAutocomplete({ lang, onSelect }: AddressAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<AddressSelection & { label: string }>>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      api
        .searchAddresses(query)
        .then((results) => setSuggestions(results))
        .catch(() => setSuggestions([]));
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pick = (item: AddressSelection & { label: string }) => {
    onSelect({ street: item.street, city: item.city, postalCode: item.postalCode });
    setQuery(item.label);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <label className="q-label">
        {lang === 'fr' ? 'Rechercher une adresse' : 'Search address'}
      </label>
      <div style={{ position: 'relative' }}>
        <MapPin className="w-4 h-4" style={{ position: 'absolute', left: 12, top: 14, color: gold }} />
        <input
          className="q-field"
          style={{ paddingLeft: 36 }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={lang === 'fr' ? '123 rue Saint-Denis, Montréal…' : '123 Saint-Denis St, Montreal…'}
        />
      </div>
      {open && suggestions.length > 0 && (
        <div
          className="stitch-box"
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            background: 'rgba(15,25,36,0.98)',
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((item, i) => (
            <button
              key={`${item.label}-${i}`}
              type="button"
              onClick={() => pick(item)}
              className="body-f"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 'none',
                borderBottom: '1px solid rgba(217,179,140,0.08)',
                background: 'transparent',
                color: '#D9B38C',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
