import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import GeoControls from '../components/map/GeoControls'
import MapControls from '../components/map/MapControl'
import PointsLayer from '../components/map/PointsLayer'

// --- Инициализация карты ---
const MapInitializer = () => {
  const map = useMap()

  useEffect(() => {
    if (!map) return
    MapControls(map)
    map.attributionControl.setPrefix('Test Client')
  }, [map])

  return null
}

// --- Главный компонент карты ---
const Map = () => {
  return (
    <MapContainer
      id="map"
      center={[49.94739, 82.64538]}
      zoom={14}
      minZoom={10}
      zoomControl={false}
      attributionControl={true}
      style={{ height: '100vh', width: '100%' }}
    >
      <MapInitializer />
      <GeoControls />
      <PointsLayer />
      <TileLayer
        url="http://tile0.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=4.png"
        // url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
    </MapContainer>
  )
}

export default Map
