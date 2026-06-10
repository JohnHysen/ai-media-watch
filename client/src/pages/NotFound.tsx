import { Paper, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
  return (
    <Paper
      sx={{
        backgroundImage: 'url(images/fire.gif)',
        backgroundSize: '100%',
        height: 600,
        width: 600,
        fontSize: 50,
        fontFamily: '"StoryScript", sans-serif',
      }}
      component={Stack}
      justifyContent={'center'}
      alignItems={'center'}
      onClick={() => navigate('/')}
    >
      <p>404 Not Found </p>
      <p>Click to return</p>
    </Paper>
  )
}

export default NotFound
