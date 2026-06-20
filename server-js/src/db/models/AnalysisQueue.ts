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
  Default,
} from 'sequelize-typescript'
import { User } from './user'

export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Table({ timestamps: true, tableName: 'AnalysisQueue' })
export class AnalysisQueue extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  @AllowNull(false)
  @Column(DataType.STRING)
  declare url: string

  @AllowNull(false)
  @Default(QueueStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(QueueStatus)))
  declare status: QueueStatus

  @AllowNull(true)
  @Column(DataType.STRING)
  declare platform: string

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare userId: number | null

  @BelongsTo(() => User, { foreignKey: 'userId' })
  declare user: User | null

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare error_message: string | null

  @AllowNull(true)
  @Column(DataType.DATE)
  declare processed_at: Date | null

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  declare priority: number

  // ✅ Счётчик попыток
  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare retries: number
}
