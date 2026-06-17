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
} from 'sequelize-typescript'

@Table({ timestamps: true })
export class AnalysisQueue extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare url: string

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare priority: number

  @Column(DataType.DATE)
  declare createdAt: Date

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare userId: number | null
}
