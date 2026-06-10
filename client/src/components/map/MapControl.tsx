import L from 'leaflet'

const controls: {
  scale?: L.Control.Scale
  zoom?: L.Control.Zoom
} = {}

const MapControls = (map: L.Map) => {
  try {
    // Удаление старых кнопок
    if (controls.scale) {
      map.removeControl(controls.scale)
    }
    if (controls.zoom) {
      map.removeControl(controls.zoom)
    }

    // Добавить линейки
    controls.scale = L.control
      .scale({
        position: 'bottomright', // внизу, справа
      })
      .addTo(map)

    // Добавить контроль зума
    controls.zoom = L.control
      .zoom({
        position: 'topright', // Сверху справа
      })
      .addTo(map)
  } catch (e) {
    console.error('Error in MapControls:', e)
  }
}

export default MapControls
