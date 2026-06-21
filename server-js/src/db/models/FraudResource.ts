import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript'
import { User } from './user'

export enum ResourceStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DISMISSED = 'dismissed',
  BLOCKED = 'blocked',
}

@Table({ timestamps: true, tableName: 'fraud_resources' })
export class FraudResource extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  @AllowNull(false)
  @Column(DataType.ENUM('youtube', 'tiktok', 'instagram', 'unknown'))
  declare platform: 'youtube' | 'tiktok' | 'instagram' | 'unknown'

  @AllowNull(false)
  @Column(DataType.STRING)
  declare username: string

  @AllowNull(true)
  @Column(DataType.STRING)
  declare channel_url: string | null

  @AllowNull(true)
  @Column(DataType.STRING)
  declare display_name: string | null

  @AllowNull(false)
  @Default(ResourceStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ResourceStatus)))
  declare status: ResourceStatus

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare dangerous_videos_count: number

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string | null

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare moderator_comment: string | null

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare tags: string | null // JSON

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare added_by: number | null

  @BelongsTo(() => User, { foreignKey: 'added_by' })
  declare addedByUser: User | null

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare verified_by: number | null

  @BelongsTo(() => User, { foreignKey: 'verified_by' })
  declare verifiedByUser: User | null

  @AllowNull(true)
  @Column(DataType.DATE)
  declare verified_at: Date | null
}
