import { Request, Response } from 'express'
import { User } from '../db/models'
import unexpectedError from '../helpers/unexpectedError'
import { generateJwt } from '../helpers/generateJwt'
import cfg from '../config'
import bcrypt from 'bcryptjs'
// import { confEmail } from '../modules/email/confEmail' // если нужно
import crypto from 'crypto'

export const signUp = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password } = req.body
    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ message: 'Введите недостающие данные!' })
    const candidate = await User.findOne({ where: { email } })
    if (candidate)
      return res
        .status(409)
        .json({ message: 'Данная почта уже зарегистрирована!' })

    const new_user = await User.create({
      email,
      password: bcrypt.hashSync(password),
      first_name,
      last_name,
      role: 'USER',
    })

    return res.status(201).json({
      message: 'Пользователь успешно зарегистрирован!',
      user: new_user,
      token: generateJwt(new_user.id, new_user.role),
    })
  } catch (e) {
    console.error('❌ signUp error:', e)
    unexpectedError(res, e)
  }
}

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Введите недостающие данные!' })
    const candidate = await User.findOne({ where: { email } })
    if (!candidate)
      return res.status(401).json({ message: 'Аккаунт не найден!' })
    if (!bcrypt.compareSync(password, candidate.password))
      return res.status(401).json({ message: 'Неверный пароль!' })
    return res.json({
      message: `Добро пожаловать, ${candidate.first_name}!`,
      user: candidate,
      token: generateJwt(candidate.id, candidate.role),
    })
  } catch (e) {
    console.error('❌ signIn error:', e)
    unexpectedError(res, e)
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.query
    if (id && typeof id === 'string') {
      const user = await User.findByPk(Number(id))
      return res.json({ user })
    } else {
      const users = await User.findAll({
        attributes: [
          'id',
          'email',
          'first_name',
          'last_name',
          'role',
          'createdAt',
          'photoURL',
        ],
        order: [['createdAt', 'DESC']],
      })
      return res.json({ users })
    }
  } catch (e) {
    console.error('❌ getUsers error:', e)
    unexpectedError(res, e)
  }
}

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { role } = req.body
    if (!role || !['USER', 'INSPECTOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }
    const user = await User.findByPk(Number(id))
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.id === req.user.id && user.role === 'ADMIN' && role !== 'ADMIN') {
      return res
        .status(403)
        .json({ error: 'You cannot downgrade your own role' })
    }
    user.role = role
    await user.save()
    res.json({
      message: `Роль пользователя ${user.email} обновлена на ${role}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    })
  } catch (e) {
    console.error('❌ updateUserRole error:', e)
    unexpectedError(res, e)
  }
}
