import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { API_BASE } from '../../config/env'

const DEBOUNCE_MS = 400
const MIN_CHARS = 3

async function fetchSuggestions(q, signal) {
  const r = await fetch(`${API_BASE}/api/geocode?q=${encodeURIComponent(q.trim())}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!r.ok) return []
  const j = await r.json()
  return Array.isArray(j.results) ? j.results : []
}

/**
 * Text input with debounced OpenStreetMap/Nominatim suggestions (via backend proxy).
 * Users may pick a suggestion or keep typing a custom address.
 */
export function LocationAutocomplete({
  field,
  autoComplete = 'off',
  placeholder = 'Type an address or place…',
  invalid,
  ariaDescribedBy,
}) {
  const listId = useId()
  const wrapRef = useRef(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [active, setActive] = useState(-1)

  const q = String(field.value ?? '')

  const runSearch = useCallback((text) => {
    abortRef.current?.abort()
    const t = String(text ?? '').trim()
    if (t.length < MIN_CHARS) {
      setItems([])
      setLoading(false)
      return
    }
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    fetchSuggestions(t, ac.signal)
      .then((list) => {
        if (!ac.signal.aborted) setItems(list)
      })
      .catch(() => {
        if (!ac.signal.aborted) setItems([])
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(q), DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
  }, [q, runSearch])

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const showList = open && (loading || items.length > 0 || (q.trim().length >= MIN_CHARS && !loading))

  function pick(item) {
    field.onChange(item.display_name)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e) {
    if (!showList && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && q.trim().length >= MIN_CHARS) {
      setOpen(true)
      return
    }
    if (!showList || items.length === 0) {
      if (e.key === 'Escape') setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0 && items[active]) {
      e.preventDefault()
      pick(items[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className="location-autocomplete" ref={wrapRef}>
      <input
        {...field}
        type="text"
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid}
        aria-describedby={ariaDescribedBy}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
        onFocus={() => {
          if (q.trim().length >= MIN_CHARS) setOpen(true)
        }}
        onChange={(e) => {
          field.onChange(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul id={listId} className="location-autocomplete__list" role="listbox" hidden={!showList}>
          {loading && (
            <li className="location-autocomplete__hint" role="presentation">
              Searching…
            </li>
          )}
          {!loading && items.length === 0 && q.trim().length >= MIN_CHARS && (
            <li className="location-autocomplete__hint" role="presentation">
              No matches — you can keep typing a custom address.
            </li>
          )}
          {!loading &&
            items.map((it, idx) => (
              <li
                key={`${it.lat},${it.lon},${idx}`}
                id={`${listId}-opt-${idx}`}
                role="option"
                aria-selected={idx === active}
                className={
                  idx === active
                    ? 'location-autocomplete__item location-autocomplete__item--active'
                    : 'location-autocomplete__item'
                }
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(it)
                }}
                onMouseEnter={() => setActive(idx)}
              >
                {it.display_name}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
