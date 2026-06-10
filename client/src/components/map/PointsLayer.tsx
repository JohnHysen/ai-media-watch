import { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { toast } from 'react-toastify'

const points = [
  { name: 'A', lat: 49.93269257460304, lon: 82.61647135019304 },
  { name: 'B', lat: 49.9326735735248, lon: 82.61657863855363 },
  { name: 'C', lat: 49.93265457243914, lon: 82.61666715145113 },
  { name: 'D', lat: 49.93263384397344, lon: 82.61672884225847 },
  { name: 'E', lat: 49.93259449593781, lon: 82.6168066263199 },
]

const PointsLayer = () => {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const icon = L.icon({
      iconUrl: '/images/lenin.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })

    const markers: L.Marker[] = []

    points.forEach((p) => {
      const marker = L.marker([p.lat, p.lon], { icon }).addTo(map)
      marker.bindPopup(`<b>${p.name}</b>`)
      markers.push(marker)
      marker.on('click', () => {
        toast.info(`Ленин ${p.name} (${p.lat}, ${p.lon})`)
      })
    })

    // --- Линии ---
    const line1 = L.polyline(
      points.map((p) => [p.lat, p.lon]),
      { color: 'blue', weight: 3, dashArray: '5, 5' }
    ).addTo(map)

    const line2 = L.polyline(
      [
        [49.9326, 82.6164],
        [49.9328, 82.6169],
      ],
      { color: 'green', weight: 2 }
    ).addTo(map)

    // --- Прямоугольник ---
    const rectangle = L.rectangle(
      [
        [49.93255, 82.6164],
        [49.93275, 82.6167],
      ],
      { color: 'red', weight: 2, fillColor: 'pink', fillOpacity: 0.3 }
    ).addTo(map)

    // --- Полигон ---
    const polygon = L.polygon(
      [
        [49.9326, 82.6165],
        [49.93265, 82.6166],
        [49.93263, 82.6167],
        [49.93258, 82.61665],
      ],
      { color: 'purple', weight: 2, fillColor: 'violet', fillOpacity: 0.4 }
    ).addTo(map)

    // --- Очистка ---
    return () => {
      markers.forEach((m) => m.remove())
      line1.remove()
      line2.remove()
      rectangle.remove()
      polygon.remove()
    }
  }, [map])

  return null
}

export default PointsLayer
