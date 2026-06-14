import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript'
import { User } from './user'

export enum DangerStatus {
  SAFE = 'safe',
  DANGEROUS = 'dangerous',
  UNCERTAIN = 'uncertain',
}

@Table({ timestamps: true, tableName: 'video_analyses' })
export class VideoAnalysis extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  @AllowNull(false)
  @Column(DataType.STRING)
  declare video_url: string // ссылка на видео

  @AllowNull(true)
  @Column(DataType.STRING)
  declare title: string | null // название видео

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare tags: string | null // теги (можно хранить как JSON или строку, я выбрал TEXT с разделителями)

  @AllowNull(false)
  @Column(DataType.FLOAT) // процент безопасности от 0 до 100
  declare safety_percent: number

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(DangerStatus)))
  declare verdict_text: DangerStatus // письменный вердикт: 'safe', 'dangerous', 'uncertain'

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare is_dangerous: boolean // true - опасное, false - безопасное

  @AllowNull(false)
  @Column(DataType.INTEGER) // длительность в секундах
  declare duration_seconds: number

  @AllowNull(true)
  @Column(DataType.STRING) // ссылка на картинку (превью/скриншот)
  declare preview_image_url: string | null

  @AllowNull(true)
  @Column(DataType.DATE)
  declare checked_at: Date // дата и время проверки (можно использовать автоматическое createdAt, но явное поле удобнее)

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare userId: number | null

  @BelongsTo(() => User, { foreignKey: 'userId' }) // ← добавили foreignKey
  declare initiator: User | null
}
