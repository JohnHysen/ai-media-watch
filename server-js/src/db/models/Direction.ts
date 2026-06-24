// src/db/models/Direction.ts
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  Default,
  AllowNull,
  Comment,
  AutoIncrement,
  IsIn,
  Min,
  Max,
  Length,
} from 'sequelize-typescript'

@Table({
  tableName: 'directions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Direction extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  @AllowNull(false)
  @Length({ min: 1, max: 200 })
  @Column({
    type: DataType.STRING(200),
    comment: 'Название направления',
  })
  declare name: string

  @Column({
    type: DataType.STRING(200),
    comment: 'Название на казахском',
  })
  declare name_kk: string | null

  @Column({
    type: DataType.STRING(200),
    comment: 'Название на английском',
  })
  declare name_en: string | null

  @Column({
    type: DataType.TEXT,
    comment: 'Описание направления',
  })
  declare description: string | null

  @Column({
    type: DataType.TEXT,
    comment: 'Ключевые слова через запятую',
    get() {
      const raw = this.getDataValue('keywords')
      return raw
        ? raw
            .split(',')
            .map((k: string) => k.trim())
            .filter(Boolean)
        : []
    },
    set(value: string | string[] | null) {
      if (Array.isArray(value)) {
        this.setDataValue('keywords', value.filter(Boolean).join(', '))
      } else if (value === null || value === undefined) {
        this.setDataValue('keywords', null)
      } else {
        this.setDataValue('keywords', value)
      }
    },
  })
  declare keywords: string | null

  @Default('medium')
  @Column({
    type: DataType.STRING(20),
    comment: 'Степень серьезности',
    validate: {
      isIn: [['low', 'medium', 'high', 'critical']],
    },
  })
  declare severity: 'low' | 'medium' | 'high' | 'critical'

  @Default(6.0)
  @Min(0)
  @Max(10)
  @Column({
    type: DataType.FLOAT,
    comment: 'Порог риска для срабатывания (0-10)',
  })
  declare risk_threshold: number

  @Default([])
  @Column({
    type: DataType.JSON,
    comment: 'Массив визуальных маркеров для детекции',
  })
  declare visual_markers: any[]

  @Default([])
  @Column({
    type: DataType.JSON,
    comment: 'Массив негативных маркеров',
  })
  declare negative_markers: any[]

  @Default('#6c757d')
  @Column({
    type: DataType.STRING(7),
    comment: 'Цвет направления для интерфейса (HEX)',
    validate: {
      isHexColor(value: string) {
        if (!/^#[0-9A-F]{6}$/i.test(value)) {
          throw new Error('Color must be a valid HEX color (e.g., #6c757d)')
        }
      },
    },
  })
  declare color: string

  @Column({
    type: DataType.STRING(50),
    comment: 'Иконка направления (например: fa-casino)',
  })
  declare icon: string | null

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    comment: 'Активно ли направление',
  })
  declare is_active: boolean

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
  })
  declare created_at: Date

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
  })
  declare updated_at: Date
}