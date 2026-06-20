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

  // ========== НАСТРОЙКИ АНАЛИЗА ==========
  @AllowNull(false)
  @Default(5)
  @Column(DataType.INTEGER)
  declare scanInterval: number

  // ========== НАСТРОЙКИ НОВОСТЕЙ ==========
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

  // ========== НАСТРОЙКИ ПАРСИНГА ==========
  @AllowNull(false)
  @Default(60)
  @Column(DataType.INTEGER)
  declare videoScrapeInterval: number

  @AllowNull(false)
  @Default(5)
  @Column(DataType.INTEGER)
  declare scrapeLimitPerPlatform: number

  @AllowNull(false)
  @Default(30)
  @Column(DataType.INTEGER)
  declare scrapeTimeoutSeconds: number

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare enableYouTube: boolean

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare enableTikTok: boolean

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare enableInstagram: boolean

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare scrapingEnabled: boolean
}
