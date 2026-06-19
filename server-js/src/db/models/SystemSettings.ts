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

@Table({ timestamps: true, tableName: 'system_settings' })
export class SystemSettings extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  @AllowNull(false)
  @Default(5)
  @Column(DataType.INTEGER)
  declare scanInterval: number

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare autoRefreshNews: boolean

  @AllowNull(false)
  @Default(60)
  @Column(DataType.INTEGER)
  declare newsParseInterval: number

  @AllowNull(false)
  @Default('[]')
  @Column(DataType.TEXT)
  declare newsSources: string
}
