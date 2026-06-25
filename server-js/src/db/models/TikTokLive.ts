import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from 'sequelize-typescript'

/**
 * Перечисление возможных вердиктов (совпадает с Python-скриптом)
 */
export enum VerdictText {
  SAFE = 'safe',
  DANGEROUS = 'dangerous',
  UNCERTAIN = 'uncertain',
}

@Table({ timestamps: true, tableName: 'video_analyses' })
export class TikTokLive extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  // ----- Поля из Python-скрипта -----
  @AllowNull(true)
  @Column(DataType.STRING)
  declare authorName: string | null

  @AllowNull(false)
  @Column(DataType.STRING)
  declare video_url: string

  @AllowNull(false)
  @Default(0)
  @Column(DataType.FLOAT)
  declare safety_percent: number

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(VerdictText)))
  declare verdict_text: VerdictText

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare reason_ru: string | null

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare reason_en: string | null

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare reason_kz: string | null

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare is_dangerous: boolean

  @AllowNull(false)
  @Default(0)
  @Column(DataType.FLOAT)
  declare duration_seconds: number

  @AllowNull(false)
  @Column(DataType.DATE)
  declare checked_at: Date

  @AllowNull(true)
  @Column(DataType.STRING)
  declare primary_risk: string | null
  // Остальные поля (createdAt, updatedAt) добавляются автоматически благодаря `timestamps: true`
}
