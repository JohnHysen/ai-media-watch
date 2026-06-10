import { Grid, Paper } from '@mui/material'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import HomeButton from '../components/HomeButton'

const data = [
  {
    name: 'Page A',
    uv: 400,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 300,
    pv: 4567,
    amt: 2400,
  },
  {
    name: 'Page C',
    uv: 320,
    pv: 1398,
    amt: 2400,
  },
  {
    name: 'Page D',
    uv: 200,
    pv: 9800,
    amt: 2400,
  },
  {
    name: 'Page E',
    uv: 278,
    pv: 3908,
    amt: 2400,
  },
  {
    name: 'Page F',
    uv: 189,
    pv: 4800,
    amt: 2400,
  },
]

const dataScatter = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
]

const data01 = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
]
const data02 = [
  { name: 'A1', value: 100 },
  { name: 'A2', value: 300 },
  { name: 'B1', value: 100 },
  { name: 'B2', value: 80 },
  { name: 'B3', value: 40 },
  { name: 'B4', value: 30 },
  { name: 'B5', value: 50 },
  { name: 'C1', value: 100 },
  { name: 'C2', value: 200 },
  { name: 'D1', value: 150 },
  { name: 'D2', value: 50 },
]

const data03 = [
  { name: 'Group A', value: 400, fill: '#0088FE' },
  { name: 'Group B', value: 300, fill: '#00C49F' },
  { name: 'Group C', value: 300, fill: '#FFBB28' },
  { name: 'Group D', value: 200, fill: '#FF8042' },
]

const dataRadar = [
  {
    subject: 'Math',
    A: 120,
    B: 110,
    fullMark: 150,
  },
  {
    subject: 'Chinese',
    A: 98,
    B: 130,
    fullMark: 150,
  },
  {
    subject: 'English',
    A: 86,
    B: 130,
    fullMark: 150,
  },
  {
    subject: 'Geography',
    A: 99,
    B: 100,
    fullMark: 150,
  },
  {
    subject: 'Physics',
    A: 85,
    B: 90,
    fullMark: 150,
  },
  {
    subject: 'History',
    A: 65,
    B: 85,
    fullMark: 150,
  },
]

const style = {
  top: '50%',
  right: 0,
  transform: 'translate(0, -50%)',
  lineHeight: '24px',
}
const dataRadBar = [
  {
    name: '18-24',
    uv: 31.47,
    pv: 2400,
    fill: '#8884d8',
  },
  {
    name: '25-29',
    uv: 26.69,
    pv: 4567,
    fill: '#83a6ed',
  },
  {
    name: '30-34',
    uv: 15.69,
    pv: 1398,
    fill: '#8dd1e1',
  },
  {
    name: '35-39',
    uv: 8.22,
    pv: 9800,
    fill: '#82ca9d',
  },
  {
    name: '40-49',
    uv: 8.63,
    pv: 3908,
    fill: '#a4de6c',
  },
  {
    name: '50+',
    uv: 2.63,
    pv: 4800,
    fill: '#d0ed57',
  },
  {
    name: 'unknown',
    uv: 6.67,
    pv: 4800,
    fill: '#ffc658',
  },
]

const Charts = () => {
  return (
    <Paper
      sx={{
        // height: 500,
        width: 1,
        p: 2,
        m: 2,
      }}
    >
      <HomeButton />
      <Grid container spacing={4}>
        <Grid size={3}>
          <LineChart
            style={{ width: '100%', aspectRatio: 1.618, maxWidth: 600 }}
            responsive
            data={data}
          >
            <CartesianGrid />
            <Line dataKey="uv" />
            <Line dataKey="pv" />
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
          </LineChart>
        </Grid>
        <Grid size={3}>
          <AreaChart
            style={{
              width: '100%',
              maxWidth: '700px',
              maxHeight: '70vh',
              aspectRatio: 1.618,
            }}
            responsive
            data={data}
            margin={{
              top: 20,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis width="auto" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="uv"
              stroke="#8884d8"
              fill="#8884d8"
            />
          </AreaChart>
        </Grid>
        <Grid size={3}>
          <BarChart
            style={{
              width: '100%',
              maxWidth: '700px',
              maxHeight: '70vh',
              aspectRatio: 1.618,
            }}
            responsive
            data={data}
            margin={{
              top: 20,
              right: 0,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis width="auto" />
            <Tooltip />
            <Legend />
            <Bar dataKey="pv" stackId="a" fill="#8884d8" background />
            <Bar dataKey="uv" stackId="a" fill="#82ca9d" background />
          </BarChart>
        </Grid>
        <Grid size={3}>
          <ScatterChart
            style={{
              width: '100%',
              maxWidth: '700px',
              maxHeight: '70vh',
              aspectRatio: 1.618,
            }}
            responsive
            margin={{
              top: 20,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="stature" unit="cm" />
            <YAxis
              type="number"
              dataKey="y"
              name="weight"
              unit="kg"
              width="auto"
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="A school" data={dataScatter} fill="#8884d8">
              <LabelList dataKey="x" fill="black" />
            </Scatter>
            <ZAxis range={[900, 4000]} dataKey="z" />
          </ScatterChart>
        </Grid>
        <Grid size={3}>
          <PieChart
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              aspectRatio: 1,
            }}
            responsive
          >
            <Pie
              data={data01}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius="50%"
              fill="#8884d8"
            />
            <Pie
              data={data02}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              fill="#82ca9d"
              label
            />
          </PieChart>
        </Grid>
        <Grid size={3}>
          <PieChart
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              aspectRatio: 1,
            }}
            responsive
          >
            <Pie
              data={data03}
              innerRadius="80%"
              outerRadius="100%"
              cornerRadius="50%"
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          </PieChart>
        </Grid>
        <Grid size={3}>
          <RadarChart
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              aspectRatio: 1,
            }}
            responsive
            outerRadius="80%"
            data={dataRadar}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 150]} />
            <Radar
              name="Mike"
              dataKey="A"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Radar
              name="Lily"
              dataKey="B"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </Grid>
        <Grid size={3}>
          <RadialBarChart
            style={{
              width: '100%',
              maxWidth: '700px',
              maxHeight: '80vh',
              aspectRatio: 1.618,
            }}
            responsive
            cx="30%"
            barSize={14}
            data={dataRadBar}
          >
            <RadialBar
              label={{ position: 'insideStart', fill: '#fff' }}
              background
              dataKey="uv"
            />
            <Legend
              iconSize={10}
              layout="vertical"
              verticalAlign="middle"
              wrapperStyle={style}
            />
          </RadialBarChart>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default Charts
