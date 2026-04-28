import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function Fit({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, bounds])
  return null
}

export function MapView({ result }) {
  if (!result) return <div className="map ph">Plan a trip to see the map.</div>

  const { route, locations } = result
  const geo = route?.geometry
  if (!geo || !geo.type) {
    return <div className="map ph">No route geometry</div>
  }
  const coords =
    (geo.type === 'LineString' && geo.coordinates) ||
    (geo.type === 'MultiLineString' && (geo.coordinates[0] || null))
  if (!coords || !coords.length) {
    return <div className="map ph">Empty route</div>
  }
  const lats = coords.map((c) => c[1])
  const lons = coords.map((c) => c[0])
  const b = L.latLngBounds(lats.map((a, i) => [a, lons[i]]))
  const center = b.getCenter()

  const onEach = (feature, layer) => {
    if (layer.setStyle) {
      layer.setStyle({ color: '#0d47a1', weight: 5, opacity: 0.85, fill: false })
    }
  }
  const fc = { type: 'Feature', geometry: geo, properties: {} }
  return (
    <div className="map-wrap">
      <MapContainer center={center} zoom={7} className="map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · Routing via <a href="https://project-osrm.org/">OSRM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON data={fc} onEachFeature={onEach} pathOptions={{ color: '#0d47a1' }} />
        {['current', 'pickup', 'dropoff'].map((k) => {
          const p = locations[k]
          if (!p) return null
          return (
            <CircleMarker
              key={k}
              center={[p.lat, p.lon]}
              radius={10}
              color={k === 'pickup' ? '#2e7d32' : k === 'dropoff' ? '#c62828' : '#1565c0'}
              fillColor={k === 'pickup' ? '#66bb6a' : k === 'dropoff' ? '#ef5350' : '#64b5f6'}
              fillOpacity={0.9}
            >
              <Popup>
                <strong>{k}</strong>
                <br />
                {p.label}
              </Popup>
            </CircleMarker>
          )
        })}
        <Fit bounds={b} />
      </MapContainer>
    </div>
  )
}
