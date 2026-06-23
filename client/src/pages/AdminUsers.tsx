import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleIcon from '@mui/icons-material/People'
import { $host } from '../http/API'
import { useUser } from '../context/user/useUser'
import { toast } from 'react-toastify'
import CyberSidebar from '../components/CyberSidebar'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Float,
  Environment,
  Stars,
  Html,
} from '@react-three/drei'
import * as THREE from 'three'

const FloatingShapes = () => {
  const groupRef = useRef<THREE.Group>(null!)
  const shapes = useMemo(
    () => [
      {
        type: 'box',
        color: '#ff3366',
        size: 0.6,
        pos: [-4, 1, -6],
        speed: 0.3,
      },
      {
        type: 'sphere',
        color: '#33ffcc',
        size: 0.8,
        pos: [5, -2, -8],
        speed: 0.2,
      },
      {
        type: 'torus',
        color: '#ffaa44',
        size: 0.7,
        pos: [2, 3, -12],
        speed: 0.4,
      },
      {
        type: 'box',
        color: '#aa66ff',
        size: 1.0,
        pos: [-3, -1, -15],
        speed: 0.15,
      },
      {
        type: 'sphere',
        color: '#44ff66',
        size: 0.9,
        pos: [0, 4, -10],
        speed: 0.25,
      },
      {
        type: 'torus',
        color: '#ff6699',
        size: 0.6,
        pos: [6, 2, -18],
        speed: 0.35,
      },
      {
        type: 'box',
        color: '#0ff',
        size: 0.8,
        pos: [-5, -3, -14],
        speed: 0.28,
      },
      {
        type: 'sphere',
        color: '#ff8844',
        size: 1.1,
        pos: [4, 1, -20],
        speed: 0.18,
      },
    ],
    []
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        const shape = shapes[idx]
        if (shape) {
          child.rotation.x = t * shape.speed * 0.5
          child.rotation.y = t * shape.speed * 0.8
          child.rotation.z = t * shape.speed * 0.3
          const offsetX = Math.sin(t * shape.speed * 0.3 + idx) * 0.5
          const offsetY = Math.cos(t * shape.speed * 0.2 + idx * 1.2) * 0.5
          child.position.x = shape.pos[0] + offsetX
          child.position.y = shape.pos[1] + offsetY
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {shapes.map((shape, idx) => {
        let geometry
        switch (shape.type) {
          case 'sphere':
            geometry = <sphereGeometry args={[shape.size * 0.5, 32, 32]} />
            break
          case 'torus':
            geometry = (
              <torusGeometry
                args={[shape.size * 0.5, shape.size * 0.2, 16, 32]}
              />
            )
            break
          default:
            geometry = (
              <boxGeometry args={[shape.size, shape.size, shape.size]} />
            )
        }
        return (
          <mesh key={idx} position={shape.pos as [number, number, number]}>
            {geometry}
            <meshStandardMaterial
              color={shape.color}
              emissive={shape.color}
              emissiveIntensity={0.3}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
        )
      })}
    </group>
  )
}

const CyberBackground3D = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      backgroundColor: '#03030f',
    }}
  >
    <Canvas
      camera={{ position: [0, 2, 14], fov: 50 }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-5, -5, 5]} color="#ff3366" intensity={0.3} />
      <FloatingShapes />
      <Stars
        radius={100}
        depth={50}
        count={1500}
        factor={4}
        saturation={0}
        fade
        speed={0.3}
      />
      <Environment preset="night" />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.12}
        target={[0, 0, 0]}
      />
    </Canvas>
  </Box>
)

interface User {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  role: 'USER' | 'INSPECTOR' | 'ADMIN'
  createdAt: string
  photoURL: string | null
  is_google: boolean
}

const ROLE_LABELS: Record<string, string> = {
  USER: 'Пользователь',
  INSPECTOR: 'Инспектор',
  ADMIN: 'Администратор',
}

const ROLE_COLORS: Record<string, 'default' | 'warning' | 'error'> = {
  USER: 'default',
  INSPECTOR: 'warning',
  ADMIN: 'error',
}

const AdminUsers = () => {
  const { user: currentUser } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<{ [key: number]: string }>(
    {}
  )
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await $host.get('/auth/users')
      console.log('Ответ от сервера:', response.data)

      if (response.data && response.data.users) {
        setUsers(response.data.users)
        const roles: { [key: number]: string } = {}
        response.data.users.forEach((u: User) => {
          roles[u.id] = u.role
        })
        setSelectedRole(roles)
      } else {
        setError('Сервер вернул некорректные данные')
      }
    } catch (err: any) {
      console.error('Ошибка загрузки пользователей:', err)
      setError(
        err.response?.data?.error || 'Не удалось загрузить пользователей'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (newRole === selectedRole[userId]) return
    if (userId === currentUser?.user_id && newRole !== 'ADMIN') {
      toast.error('Вы не можете понизить свою собственную роль')
      return
    }
    setUpdatingId(userId)
    try {
      await $host.put(`/auth/users/${userId}/role`, { role: newRole })
      setSelectedRole((prev) => ({ ...prev, [userId]: newRole }))
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      )
      toast.success(`Роль пользователя обновлена на ${ROLE_LABELS[newRole]}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка обновления роли')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.first_name &&
        u.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.last_name &&
        u.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#0ff' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <CyberBackground3D />

      {!drawerOpen && (
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1300,
            color: '#0ff',
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            '&:hover': { bgcolor: '#0ff', color: '#000' },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <CyberSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          px: 3,
          py: 8,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            <PeopleIcon sx={{ mr: 1 }} /> Управление пользователями
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            variant="outlined"
            sx={{
              borderColor: '#0ff',
              color: '#0ff',
              '&:hover': { bgcolor: 'rgba(0,255,255,0.1)' },
            }}
          >
            Обновить
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Поиск по email или имени..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(0,0,0,0.4)',
              borderRadius: '40px',
              '& fieldset': { borderColor: '#0ff' },
            },
            input: { color: '#fff' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#0ff' }} />
              </InputAdornment>
            ),
          }}
        />

        {error ? (
          <Alert
            severity="error"
            sx={{
              bgcolor: 'rgba(255,51,102,0.2)',
              color: '#ff8888',
              border: '1px solid #ff3366',
            }}
          >
            {error}
          </Alert>
        ) : users.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              bgcolor: 'rgba(0,255,255,0.1)',
              color: '#0ff',
              border: '1px solid #0ff',
            }}
          >
            Пользователи не найдены
          </Alert>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: 'rgba(10,10,30,0.7)',
              backdropFilter: 'blur(8px)',
              borderRadius: 4,
              border: '1px solid rgba(0,255,255,0.3)',
              boxShadow: '0 0 20px rgba(0,255,255,0.1)',
              overflowX: 'auto',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Имя
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Фамилия
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        sx={{
                          color: '#0ff',
                          '& .MuiSelect-icon': { color: '#0ff' },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0,255,255,0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0ff',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0ff',
                          },
                        }}
                      >
                        <MenuItem value="all" sx={{ color: '#2c2c2c' }}>
                          Все
                        </MenuItem>
                        <MenuItem value="USER" sx={{ color: '#000000' }}>
                          Пользователь
                        </MenuItem>
                        <MenuItem value="INSPECTOR" sx={{ color: '#99bc00' }}>
                          Инспектор
                        </MenuItem>
                        <MenuItem value="ADMIN" sx={{ color: '#ff0000' }}>
                          Администратор
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Дата регистрации
                  </TableCell>
                  <TableCell sx={{ color: '#0ff', fontWeight: 'bold' }}>
                    Изменить роль
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow
                    key={u.id}
                    sx={{ '&:hover': { bgcolor: 'rgba(0,255,255,0.05)' } }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{u.id}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{u.email}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {u.first_name || '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {u.last_name || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ROLE_LABELS[u.role]}
                        color={ROLE_COLORS[u.role]}
                        size="small"
                        sx={{ fontWeight: 'bold', minWidth: 80, color: '#fff' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={selectedRole[u.id] || u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          disabled={
                            updatingId === u.id || u.id === currentUser?.user_id
                          }
                          sx={{
                            color: '#fff',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#0ff',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#33ffcc',
                            },
                            '& .MuiSelect-icon': { color: '#0ff' },
                          }}
                        >
                          <MenuItem value="USER" sx={{ color: '#000000' }}>
                            Пользователь
                          </MenuItem>
                          <MenuItem value="INSPECTOR" sx={{ color: '#b7cf00' }}>
                            Инспектор
                          </MenuItem>
                          <MenuItem value="ADMIN" sx={{ color: '#ff0000' }}>
                            Администратор
                          </MenuItem>
                        </Select>
                      </FormControl>
                      {updatingId === u.id && (
                        <CircularProgress
                          size={20}
                          sx={{ ml: 1, color: '#0ff' }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  )
}

export default AdminUsers
