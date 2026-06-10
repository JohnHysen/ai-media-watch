import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Stack,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { createBalanceRequest } from '../http/API'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  onClose: () => void
}

export default function BalanceRequestModal({ open, onClose }: Props) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('kaspi')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })
  const { t, ready } = useTranslation()
  if (!ready) return null

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showNotification(t('vvedite-ko'), 'warning')
      return
    }
    setLoading(true)
    try {
      await createBalanceRequest({
        amount: parseFloat(amount),
        paymentMethod,
        comment,
      })
      showNotification(t('zayavka-ot'), 'success')
      onClose()
      setAmount('')
      setComment('')
    } catch (err) {
      console.log(err)
      showNotification(t('oshibka-pr-1'), 'warning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(20,20,20,0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: 4,
          border: '1px solid rgba(255,215,0,0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          color: 'white',
          position: 'relative',
          backgroundImage: `url('/images/body.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        },
      }}
    >
      <DialogTitle
        sx={{
          color: '#ffd966',
          fontWeight: 600,
          textAlign: 'center',
          borderBottom: '1px dashed rgba(255,215,0,0.5)',
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {t('popolnenie')}
        <IconButton
          onClick={onClose}
          sx={{
            color: '#ffd966',
            transition: '0.2s',
            '&:hover': {
              color: '#fff',
              transform: 'rotate(90deg)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <TextField
            label={t('summa-teng')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: '#aaa' } }}
            sx={{
              input: { color: 'white' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#ffd966' },
                '&.Mui-focused fieldset': { borderColor: '#ffd966' },
              },
            }}
          />
          <TextField
            select
            label={t('sposob-opl')}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: '#aaa' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#ffd966' },
                '&.Mui-focused fieldset': { borderColor: '#ffd966' },
              },
              '& .MuiSelect-select': { color: 'white' },
              '& .MuiSvgIcon-root': { color: '#ffd966' },
            }}
          >
            <MenuItem value="kaspi">Kaspi</MenuItem>
            <MenuItem value="card">{t('bankovskay')}</MenuItem>
            <MenuItem value="paypal">PayPal</MenuItem>
          </TextField>
          <TextField
            label={t('kommentari')}
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: '#aaa' } }}
            sx={{
              textarea: { color: 'white' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#ffd966' },
                '&.Mui-focused fieldset': { borderColor: '#ffd966' },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              bgcolor: '#ffd966',
              color: '#1e1e1e',
              fontWeight: 'bold',
              py: 1.5,
              borderRadius: 2,
              '&:hover': { bgcolor: '#e6c84d' },
              '&.Mui-disabled': { bgcolor: '#5a5a5a' },
            }}
          >
            {loading ? t('otpravka') : t('otpravit-z')}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={3000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Alert severity={snackbar.severity as any} variant="filled">
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
