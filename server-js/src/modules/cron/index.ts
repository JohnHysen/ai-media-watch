import cron from 'node-cron'

// Каждая минута - убрал для экономии памяти
// cron.schedule('* * * * *', () => {
//   console.log('running a task every minute')
// })
// Или в каждой минуте десятая секунда: 10 * * * * *

// Каждая секунда
// cron.schedule('* * * * * *', () => {
//   console.log('running a task every second')
// })

// Каждый день в 9:30
cron.schedule('30 9 * * *', () => {
  console.log('running at 9:30')
})
// cron.schedule('30 9 * * *', async () => {
//   const users = await User.findAll()
//   const date = new Date()
//   const dow = date.getDay()
//   users.forEach((u) => {
//     if (u.balance < 100 && u.tg_id && u.notification_preferences[dow]) {
//       bot.telegram.sendMessage(u.tg_id, 'У вас заканчиваются деньги!')
//     }
//   })
// })

// 25-ое число каждого месяца в 9:30
cron.schedule('30 9 25 * *', () => {
  console.log('running a task every 25.x at 9:30')
})
