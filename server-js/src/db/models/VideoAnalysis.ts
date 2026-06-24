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
  declare video_url: string

  @AllowNull(true)
  @Column(DataType.STRING)
  declare title: string | null

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare tags: string | null

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare safety_percent: number

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(DangerStatus)))
  declare verdict_text: DangerStatus

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare reason_ru: string

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare reason_en: string

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare reason_kz: string

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare is_dangerous: boolean

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare duration_seconds: number

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare preview_image_url: string | null

  @AllowNull(true)
  @Column(DataType.DATE)
  declare checked_at: Date

  @AllowNull(true)
  @Column(DataType.STRING)
  declare primary_risk: string | null

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare userId: number | null

  @BelongsTo(() => User, { foreignKey: 'userId' })
  declare initiator: User | null

  @AllowNull(true)
  @Column(DataType.STRING)
  declare uploader: string | null
}
