import { Request, Response } from 'express'
import { User } from '../db/models'
import unexpectedError from '../helpers/unexpectedError'
import { generateJwt } from '../helpers/generateJwt'
import { OAuth2Client } from 'google-auth-library'
import cfg from '../config'
import bcrypt from 'bcryptjs'
import { confEmail } from '../modules/email/confEmail'

const googleClient = new OAuth2Client(cfg.GOOGLE_CLIENT_ID)

export const signUp = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password } = req.body

    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({
        message: 'Введите недостающие данные!',
      })

    const candidate = await User.findOne({ where: { email } })

    if (candidate)
      return res.status(409).json({
        message: 'Данная почта уже зарегистрирована!',
      })

    const secret = crypto.randomUUID()
    const new_user = await User.create({
      email,
      password: bcrypt.hashSync(password),
      first_name: first_name,
      last_name: last_name,
      role: 'USER',
      activation_code: secret,
    })

    await confEmail(email, secret)

    return res.status(201).json({
      message: 'Пользователь успешно зарегистрирован!',
      user: new_user,
      token: generateJwt(new_user.id, new_user.role),
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({
        message: 'Введите недостающие данные!',
      })

    const candidate = await User.findOne({
      where: { email },
    })

    if (!candidate)
      return res.status(401).json({
        message: 'Аккаунт не найден!',
      })

    if (candidate.is_google)
      return res.status(401).json({
        message: 'Авторизуйтесь через Google-аккаунт!',
      })

    if (!bcrypt.compareSync(password, candidate.password))
      return res.status(401).json({
        message: 'Неверный пароль!',
      })

    return res.json({
      message: `Добро пожаловать, ${candidate.first_name}!`,
      user: candidate,
      token: generateJwt(candidate.id, candidate.role),
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: cfg.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const email = payload?.email

    if (!email) return res.status(400).json({ message: 'Invalid token' })

    let user = await User.findOne({ where: { email } })
    const secret = crypto.randomUUID()
    if (!user) {
      user = await User.create({
        email,
        first_name: payload.given_name,
        last_name: payload.family_name,
        photoURL: payload.picture,
        password: bcrypt.hashSync('googleauthextpassword' + Math.random()),
        role: 'USER',
        active: true,
        is_google: true,
        activation_code: secret,
      })
    }

    if (user) {
      return res.json({
        message: `Добро пожаловать, ${user.first_name}!`,
        user,
        token: generateJwt(user.id, user.role),
      })
    }
  } catch (e) {
    unexpectedError(res, e)
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.query

    if (id && typeof id === 'string') {
      return res.json({
        user: await User.findByPk(Number(id)),
      })
    } else {
      return res.json({
        users: await User.findAll(),
      })
    }
  } catch (e) {
    unexpectedError(res, e)
  }
}

