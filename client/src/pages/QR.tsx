import { Divider, Paper, TextField, Typography } from '@mui/material'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { toast } from 'react-toastify'
import HomeButton from '../components/HomeButton'

const highlightCodeOnCanvas = (detectedCodes: any, ctx: any) => {
  detectedCodes.forEach((detectedCode: any) => {
    const { boundingBox, cornerPoints } = detectedCode

    // Draw bounding box
    ctx.strokeStyle = '#00FF00'
    ctx.lineWidth = 4
    ctx.strokeRect(
      boundingBox.x,
      boundingBox.y,
      boundingBox.width,
      boundingBox.height
    )

    // Draw corner points
    ctx.fillStyle = '#FF0000'
    cornerPoints.forEach((point: any) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)
      ctx.fill()
    })
  })
}

const QR = () => {
  const [qrtext, setQRtext] = useState('')
  const [qrinput, setQRinput] = useState('')
  const [isPaused, setIsPaused] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setHasPermission(true)
    } catch (e) {
      console.error('Нет доступа к камере', e)
      setHasPermission(false)
      toast.info('Разрешение на камеру отклонено.')
    }
  }
  useEffect(() => {
    requestCameraPermission()
  }, [])
  return (
    <Paper sx={{ p: 2 }}>
      <HomeButton />
      {hasPermission && (
        <Scanner
          onScan={(result) => {
            if (result) {
              const val = result[0].rawValue
              setQRtext(val)
              toast.info(val)
              setIsPaused(true)
              setTimeout(() => setIsPaused(false), 1500)
            }
          }}
          onError={(error) => console.log(error)}
          formats={['qr_code']}
          components={{
            tracker: highlightCodeOnCanvas,
          }}
          paused={isPaused}
          constraints={{
            facingMode: 'environment',
            aspectRatio: 1,
            width: { ideal: 500 },
            height: { ideal: 500 },
          }}
        />
      )}
      <Typography maxWidth={250}>Считано: {qrtext}</Typography>
      <Divider sx={{ my: 2 }} />
      <TextField
        value={qrinput}
        onChange={(e) => setQRinput(e.target.value)}
        placeholder="Значение QR-кода"
        fullWidth
      />
      <QRCode
        value={qrinput}
        size={300}
        style={{
          height: 'auto',
          maxWidth: '100%',
          width: '100%',
          padding: '10px',
        }}
      />
    </Paper>
  )
}

export default QR
