import Place from '@mui/icons-material/Place'
import NearMe from '@mui/icons-material/NearMe'
import NearMeDisabled from '@mui/icons-material/NearMeDisabled'
import { Paper, IconButton, Tooltip } from '@mui/material'
import L from 'leaflet'
import { useState, useRef } from 'react'
import { useMap } from 'react-leaflet'
import HomeButton from '../HomeButton'

const GeoControls = () => {
  const map = useMap() // получаем доступ к экземпляру карты

  const [watching, setWatching] = useState(false)
  const watcher = useRef<number | null>(null)

  const markerRef = useRef<L.Marker | null>(null)
  const locRef = useRef<L.CircleMarker | null>(null)

  // Определение местоположения один раз
  const geolocateOnce = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locRef.current?.remove()
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude)
        map.setView(latlng, 16)
        locRef.current = L.circleMarker(latlng, {
          color: 'blue',
          radius: 8,
        }).addTo(map)
      },
      (err) => {
        console.error('Ошибка геолокации:', err.message)
        alert('Не удалось определить местоположение.')
      }
    )
  }

  // Постоянное отслеживание координат
  const geolocateWatch = () => {
    if (!map) return

    if (watching) {
      // Останавливаем слежение
      setWatching(false)
      if (watcher.current !== null) {
        navigator.geolocation.clearWatch(watcher.current)
        watcher.current = null
      }

      // Удаляем метку и тултип
      markerRef.current?.unbindTooltip()
      markerRef.current?.remove()
      markerRef.current = null
    } else {
      // Запускаем отслеживание
      setWatching(true)
      watcher.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading, speed } = pos.coords
          const latlng = L.latLng(latitude, longitude)

          // Создаём или обновляем маркер
          if (!markerRef.current) {
            const icon = L.divIcon({
              className: 'geo-marker',
              html: `
              <div style="
                transform: rotate(${heading ?? 0}deg);
                width: 24px; height: 24px;
                background: rgba(0, 123, 255, 0.8);
                clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
                border-radius: 2px;
              "></div>
            `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })

            markerRef.current = L.marker(latlng, { icon }).addTo(map)
            // Привязываем постоянный тултип
            markerRef.current
              .bindTooltip(
                `Скорость: ${((speed || 0) * 3.6).toFixed(1)} км/ч\nНаправление: ${
                  heading ?? 0
                }°`,
                { permanent: true, offset: [0, -10], direction: 'top' }
              )
              .openTooltip()
            // Центрируем карту
            map.setView(latlng, 16)
          } else {
            markerRef.current.setLatLng(latlng)
            const el = markerRef.current.getElement()?.firstChild as HTMLElement
            if (el && heading !== null && heading !== undefined)
              el.style.transform = `rotate(${heading}deg)`

            // Обновляем тултип
            markerRef.current.setTooltipContent(
              `Скорость: ${((speed || 0) * 3.6).toFixed(1)} км/ч\nНаправление: ${
                heading ?? 0
              }°`
            )
          }
        },
        (err) => {
          console.error('Ошибка геолокации:', err.message)
          alert('Не удалось определить местоположение.')
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      )
    }
  }

  return (
    <Paper sx={{ position: 'absolute', top: 10, left: 10, zIndex: 401 }}>
      <HomeButton />
      <Tooltip title="Моя геолокация" placement="bottom" arrow>
        <IconButton onClick={geolocateOnce}>
          <Place />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={watching ? 'Слежение активно' : 'Слежение неактивно'}
        placement="bottom"
        arrow
      >
        <IconButton onClick={geolocateWatch}>
          {watching ? <NearMe /> : <NearMeDisabled />}
        </IconButton>
      </Tooltip>
    </Paper>
  )
}

export default GeoControls
