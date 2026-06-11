import React, { useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  Divider,
  LinearProgress,
  Avatar,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningIcon from '@mui/icons-material/Warning'
import SecurityIcon from '@mui/icons-material/Security'
import PaymentsIcon from '@mui/icons-material/Payments'
import CasinoIcon from '@mui/icons-material/Casino'
import AnnouncementIcon from '@mui/icons-material/Announcement'
import BlockIcon from '@mui/icons-material/Block'
import VerifiedIcon from '@mui/icons-material/Verified'
import ChatIcon from '@mui/icons-material/Chat'
import LinkIcon from '@mui/icons-material/Link'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import CyberSidebar from '../components/CyberSidebar'

// ---------- Компонент куба (фон) ----------
const FloatingCube = ({ position, color, size, speed }) => {
  const meshRef = React.useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * speed
      meshRef.current.rotation.y = clock.getElapsedTime() * speed * 0.8
      meshRef.current.rotation.z = clock.getElapsedTime() * speed * 0.6
    }
  })
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  )
}

const CubeSpaceBackground = () => {
  const cubes = [
    { color: '#ff3366', size: 0.8, position: [-4, 1, -6], speed: 0.3 },
    { color: '#33ffcc', size: 1.0, position: [5, -2, -8], speed: 0.2 },
    { color: '#ffaa44', size: 0.7, position: [2, 3, -12], speed: 0.4 },
    { color: '#aa66ff', size: 1.2, position: [-3, -1, -15], speed: 0.15 },
    { color: '#44ff66', size: 0.9, position: [0, 4, -10], speed: 0.25 },
    { color: '#ff6699', size: 0.6, position: [6, 2, -18], speed: 0.35 },
    { color: '#0ff', size: 0.8, position: [-5, -3, -14], speed: 0.28 },
    { color: '#ff8844', size: 1.1, position: [4, 1, -20], speed: 0.18 },
  ]
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        backgroundColor: '#030318',
      }}
    >
      <Canvas camera={{ position: [0, 2, 12], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-5, -5, 5]} color="#ff3366" intensity={0.3} />
        {cubes.map((cube, idx) => (
          <FloatingCube key={idx} {...cube} />
        ))}
        <Stars
          radius={100}
          depth={60}
          count={2000}
          factor={5}
          saturation={0}
          fade
          speed={0.2}
        />
        <Environment preset="night" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.08}
          target={[0, 0, 0]}
        />
      </Canvas>
    </Box>
  )
}

// ---------- Данные угроз: ТОЛЬКО про выявление мошенничества в видео соцсетей ----------
const threatCategories = [
  {
    id: 'gambling',
    title: 'Нелегальные онлайн-казино',
    icon: <CasinoIcon sx={{ fontSize: 40 }} />,
    color: '#ff3366',
    riskLevel: 'Критично',
    riskValue: 97,
    description:
      'Реклама и призывы к регистрации в онлайн-казино через видео в TikTok, Instagram, YouTube.',
    spread:
      'Видео с «успешными игроками», демонстрацией выигрышей, ссылками в описании. AI распознаёт визуальные маркеры (рулетка, карты, фишки), а также ключевые фразы в аудиодорожке.',
    whatToDo:
      'Не переходите по ссылкам в описании. Наш AI Media Watch автоматически помечает такие видео и отправляет в приоритетный список для модерации.',
    stats:
      'За последний месяц система выявила 1 247 подозрительных видео, 89% из них содержали скрытую рекламу казино. АФМ пресекла схему вывода 600 млрд тенге через соцсети.',
  },
  {
    id: 'pyramid',
    title: 'Финансовые пирамиды и хайпы',
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    color: '#ff8844',
    riskLevel: 'Высокий риск',
    riskValue: 89,
    description:
      'Видео, обещающие «гарантированный доход», «пассивный заработок», «инвестиции под 50% в месяц».',
    spread:
      'Короткие ролики с агрессивными инвест-призывами, скриншотами «заработка», приглашениями в Telegram-каналы. AI анализирует текст, субтитры и аудио на наличие фраз-маркеров пирамид.',
    whatToDo:
      'Помните: высокий доход без риска невозможен. Наш AI вычисляет такие видео по паттернам речи и визуальной стилистике. Сообщайте о подозрительных роликах.',
    stats:
      'Еженедельно AI находит более 500 новых пирамидных схем. Только за прошлый месяц заблокировано 78 Telegram-каналов, продвигавших псевдоинвестиции.',
  },
  {
    id: 'referral',
    title: 'Реферальные схемы',
    icon: <LinkIcon sx={{ fontSize: 40 }} />,
    color: '#ff9966',
    riskLevel: 'Средний риск',
    riskValue: 72,
    description:
      'Видео с призывами регистрироваться по реферальным ссылкам в казино, бинарных опционах, криптопроектах.',
    spread:
      'Блогеры скрыто рекламируют реферальные программы, маскируя их под «личный опыт». AI анализирует ссылки в описании, комментариях, а также распознаёт упоминания «партнёрской программы».',
    whatToDo:
      'Не переходите по подозрительным реферальным ссылкам. Наша система автоматически проверяет все ссылки из видео и помечает мошеннические.',
    stats:
      'За 2025 год AI выявил более 8 000 реферальных ссылок на нелегальные казино и финансовые пирамиды в видео из Казахстана.',
  },
  {
    id: 'fraud',
    title: 'Обман и «легкие деньги»',
    icon: <PaymentsIcon sx={{ fontSize: 40 }} />,
    color: '#ff6666',
    riskLevel: 'Высокий риск',
    riskValue: 93,
    description:
      'Видео, обещающие быстрый заработок на инвестициях, криптовалюте, форексе, «секретных схемах».',
    spread:
      'Ролики с нарезкой «богатой жизни», психологические триггеры («успешный успех»), призывы вступить в закрытый клуб. AI анализирует аудио на агрессивные интонации и запрещённые фразы.',
    whatToDo:
      'Не верьте обещаниям лёгких денег. Наш AI распознаёт эти паттерны и блокирует видео ещё до того, как оно наберёт популярность.',
    stats:
      'Среднесуточный объём такого контента на казахстанском сегменте TikTok — около 200 новых видео. AI обрабатывает их за 2-3 минуты.',
  },
  {
    id: 'visual',
    title: 'Визуальные маркеры (рулетка, карты, автоматы)',
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    color: '#ffaa44',
    riskLevel: 'Средний риск',
    riskValue: 68,
    description:
      'Видео, где мелькают игровые автоматы, рулетка, покерные столы – явные признаки нелегального казино.',
    spread:
      'Скрытая реклама через обзоры «игровых стратегий», демонстрацию «выигрышей», но без прямой ссылки. AI-модель YOLOv8 обучена распознавать такие объекты.',
    whatToDo:
      'AI Media Watch автоматически фиксирует эти кадры и добавляет их в отчёт с временными метками. Модератору остаётся только подтвердить.',
    stats:
      'Точность детекции визуальных маркеров — 94,2%. За месяц обработано более 50 000 кадров с разметкой.',
  },
]

// Новости – только о мониторинге соцсетей, AI и борьбе с мошенничеством в видео
const newsAndSources = [
  {
    title:
      'В Казахстане запущен AI-мониторинг соцсетей для выявления онлайн-казино',
    date: '12 февраля 2025',
    source: 'Агентство по финансовому мониторингу',
    url: 'https://www.gov.kz/memleket/entities/afm/press/news',
  },
  {
    title: 'Как распознать финансовую пирамиду в TikTok: советы FinGramota',
    date: '25 января 2025',
    source: 'FinGramota.kz',
    url: 'https://fingramota.kz/ru/news/kak-raspoznat-finansovuyu-piramidu-v-tiktok',
  },
  {
    title:
      'Более 2 000 реферальных ссылок на казино заблокировано в Instagram за месяц',
    date: '5 марта 2025',
    source: 'Министерство цифрового развития РК',
    url: 'https://www.gov.kz/memleket/entities/mdai',
  },
  {
    title: 'АФМ: через соцсети распространяется 70% нелегальной рекламы казино',
    date: '18 февраля 2025',
    source: 'Zakon.kz',
    url: 'https://www.zakon.kz',
  },
]

// ---------- Главный компонент Analytics ----------
const Analytics = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <CubeSpaceBackground />
      <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
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

        <CyberSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <Box sx={{ px: '10%', py: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #ff3366, #33ffcc)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Аналитика угроз в видео
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: '#aaa', mb: 4, textAlign: 'center' }}
            >
              Как AI Media Watch выявляет мошенничество, казино и пирамиды в
              TikTok, Instagram и YouTube
            </Typography>
          </motion.div>

          {/* Рейтинг угроз */}
          <Typography variant="h5" sx={{ color: '#0ff', mb: 3 }}>
            📊 Рейтинг угроз по уровню риска (по данным AI)
          </Typography>
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {threatCategories.map((threat, idx) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={idx}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    sx={{
                      bgcolor: 'rgba(10,10,30,0.7)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 4,
                      border: `1px solid ${threat.color}`,
                      height: '100%',
                      transition: '0.2s',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: `0 0 20px ${threat.color}`,
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{ bgcolor: threat.color, width: 56, height: 56 }}
                        >
                          {threat.icon}
                        </Avatar>
                        <Chip
                          label={threat.riskLevel}
                          sx={{
                            bgcolor: threat.color,
                            color: '#fff',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}
                      >
                        {threat.title}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          Уровень риска:
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={threat.riskValue}
                          sx={{
                            flexGrow: 1,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#333',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: threat.color,
                            },
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: threat.color, fontWeight: 'bold' }}
                        >
                          {threat.riskValue}%
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#ddd', mb: 1 }}>
                        <strong>Описание:</strong> {threat.description}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ddd', mb: 1 }}>
                        <strong>Как AI распознаёт:</strong> {threat.spread}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#ffaa66', mb: 1 }}
                      >
                        <strong>Что делать:</strong> {threat.whatToDo}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#aaa', display: 'block', mt: 1 }}
                      >
                        <strong>Статистика AI:</strong> {threat.stats}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Официальные источники + новости */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  bgcolor: 'rgba(10,10,30,0.7)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 4,
                  border: '1px solid rgba(0,255,255,0.3)',
                  p: 3,
                  height: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#33ffcc',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <VerifiedIcon /> Официальные источники
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{ bgcolor: 'transparent', boxShadow: 'none' }}
                >
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>
                          Агентство по финансовому мониторингу (АФМ)
                        </TableCell>
                        <TableCell>
                          <Link
                            href="https://t.me/afm_rk"
                            target="_blank"
                            sx={{ color: '#0ff' }}
                          >
                            Telegram-канал
                          </Link>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>
                          FinGramota.kz
                        </TableCell>
                        <TableCell>
                          <Link
                            href="https://fingramota.kz"
                            target="_blank"
                            sx={{ color: '#0ff' }}
                          >
                            fingramota.kz
                          </Link>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>
                          Министерство цифрового развития РК
                        </TableCell>
                        <TableCell>
                          <Link
                            href="https://www.gov.kz/memleket/entities/mdai"
                            target="_blank"
                            sx={{ color: '#0ff' }}
                          >
                            Официальный сайт
                          </Link>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#fff' }}>
                          АРРФР (финрынок)
                        </TableCell>
                        <TableCell>
                          <Link
                            href="https://www.gov.kz/memleket/entities/arrfr"
                            target="_blank"
                            sx={{ color: '#0ff' }}
                          >
                            Официальный сайт
                          </Link>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  bgcolor: 'rgba(10,10,30,0.7)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 4,
                  border: '1px solid rgba(0,255,255,0.3)',
                  p: 3,
                  height: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#33ffcc',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <AnnouncementIcon /> Последние новости по теме
                </Typography>
                <Box>
                  {newsAndSources.map((news, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom:
                          idx !== newsAndSources.length - 1
                            ? '1px solid rgba(0,255,255,0.2)'
                            : 'none',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#ffaa66' }}>
                        {news.date}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <Link
                          href={news.url}
                          target="_blank"
                          sx={{ color: '#0ff', fontWeight: 500 }}
                          underline="hover"
                        >
                          {news.title}
                        </Link>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        {news.source}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(0,255,255,0.2)' }} />
                <Typography variant="body2" sx={{ color: '#ddd' }}>
                  <strong>📞 Куда сообщить о мошенническом видео?</strong>
                  <br />
                  • АФМ: +7 (7172) 73-01-01
                  <br />• Жалоба через AI Media Watch (кнопка «Пожаловаться»)
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Памятка для пользователей */}
          <Card
            sx={{
              bgcolor: 'rgba(10,10,30,0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: 4,
              border: '1px solid #0ff',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: '#0ff', mb: 2 }}>
              🤖 Как AI Media Watch защищает вас?
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <BlockIcon sx={{ color: '#ff3366', fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Автоматический анализ видео
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ChatIcon sx={{ color: '#33ffcc', fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Распознавание аудио и субтитров
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <SecurityIcon sx={{ color: '#ffaa44', fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Обнаружение визуальных маркеров
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LinkIcon sx={{ color: '#ff6666', fontSize: 30 }} />
                  <Typography variant="body2" sx={{ color: '#ddd' }}>
                    Проверка ссылок на мошенничество
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Box>
      </Box>
    </>
  )
}

export default Analytics
