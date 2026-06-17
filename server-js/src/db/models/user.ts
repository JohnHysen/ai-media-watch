import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  Default,
  HasMany,
} from 'sequelize-typescript'
import { VideoAnalysis } from './VideoAnalysis'

@Table({ timestamps: true })
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string

  @AllowNull(false)
  @Column(DataType.STRING)
  declare password: string

  @AllowNull(true)
  @Column(DataType.STRING)
  declare first_name: string | null

  @AllowNull(true)
  @Column(DataType.STRING)
  declare last_name: string | null

  @Default('USER')
  @AllowNull(false)
  @Column(DataType.STRING)
  declare role: 'ADMIN' | 'USER'

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_google: boolean

  @Default(0)
  @Column(DataType.INTEGER)
  declare balance: number

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_online: boolean

  @Column(DataType.DATE)
  declare last_seen: Date

  @HasMany(() => VideoAnalysis, { foreignKey: 'userId' }) // ← добавили foreignKey
  declare video_analyses: VideoAnalysis[]

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare photoURL: string | null
}
