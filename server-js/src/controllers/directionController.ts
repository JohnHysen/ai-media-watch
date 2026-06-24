// src/controllers/direction.controller.ts
import { Request, Response } from 'express';
import { Direction } from '../db/models/Direction';
import { Op } from 'sequelize';
import { LLMService } from '../services/llmService';
import axios from 'axios';

/**
 * Создание нового направления
 */
export const createDirection = async (req: Request, res: Response) => {
  try {
    const {
      name,
      name_kk,
      name_en,
      description,
      keywords,
      severity,
      risk_threshold,
      visual_markers,
      negative_markers,
      color,
      icon,
      is_active,
    } = req.body;

    // Проверка обязательных полей
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name',
      });
    }

    const direction = await Direction.create({
      name,
      name_kk: name_kk || null,
      name_en: name_en || null,
      description: description || null,
      keywords: keywords || null,
      severity: severity || 'medium',
      risk_threshold: risk_threshold || 6.0,
      visual_markers: visual_markers || [],
      negative_markers: negative_markers || [],
      color: color || '#6c757d',
      icon: icon || null,
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json(direction);
  } catch (error: any) {
    console.error('❌ Ошибка при создании Direction:');
    console.error('  Сообщение:', error.message);
    console.error('  Стек:', error.stack);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((e: any) => e.message),
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Получение всех направлений
 */
export const getAllDirections = async (req: Request, res: Response) => {
  try {
    const { is_active, severity, search, limit = 50, offset = 0 } = req.query;
    
    const whereClause: any = {};
    
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    
    if (severity) {
      whereClause.severity = severity;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const directions = await Direction.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [['created_at', 'DESC']],
    });

    res.json({
      total: directions.count,
      limit: Number(limit),
      offset: Number(offset),
      data: directions.rows,
    });
  } catch (error) {
    console.error('❌ Ошибка при получении направлений:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Получение одного направления по ID
 */
export const getDirectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const direction = await Direction.findByPk(id);

    if (!direction) {
      return res.status(404).json({ error: 'Direction not found' });
    }

    res.json(direction);
  } catch (error) {
    console.error('❌ Ошибка при получении направления:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Обновление направления
 */
export const updateDirection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const direction = await Direction.findByPk(id);
    if (!direction) {
      return res.status(404).json({ error: 'Direction not found' });
    }

    await direction.update(updates);

    res.json(direction);
  } catch (error: any) {
    console.error('❌ Ошибка при обновлении направления:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((e: any) => e.message),
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Удаление направления (мягкое или жесткое)
 */
export const deleteDirection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    const direction = await Direction.findByPk(id);
    if (!direction) {
      return res.status(404).json({ error: 'Direction not found' });
    }

    if (hard === 'true') {
      // Жесткое удаление
      await direction.destroy({ force: true });
    } else {
      // Мягкое удаление
      await direction.destroy();
    }

    res.json({ message: 'Direction deleted successfully' });
  } catch (error) {
    console.error('❌ Ошибка при удалении направления:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * ГЕНЕРАЦИЯ СТРУКТУРЫ через LLM (только генерация, без сохранения)
 */
export const generateDirectionStructure = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required for generation',
      });
    }

    // Генерация структуры через LLM
    const generatedStructure = await LLMService.generateDirectionStructure({
      name,
      description: description || '',
    });

    res.json({
      success: true,
      data: generatedStructure,
      message: 'Structure generated successfully',
    });
  } catch (error: any) {
    console.error('❌ Ошибка при генерации структуры:', error);
    res.status(500).json({
      error: 'Failed to generate direction structure',
      details: error.message,
    });
  }
};

/**
 * ГЕНЕРАЦИЯ И СОЗДАНИЕ - объединенный метод
 */
export const generateAndCreateDirection = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required for generation',
      });
    }

    // Генерация структуры через LLM
    const generatedStructure = await LLMService.generateDirectionStructure({
      name,
      description: description || '',
    });

    // Создаем направление (без code)
    const direction = await Direction.create({
      name: generatedStructure.name || name,
      name_kk: generatedStructure.name_kk || null,
      name_en: generatedStructure.name_en || null,
      description: generatedStructure.description || description || null,
      keywords: generatedStructure.keywords || null,
      severity: generatedStructure.severity || 'medium',
      risk_threshold: generatedStructure.risk_threshold || 6.0,
      visual_markers: generatedStructure.visual_markers || [],
      negative_markers: generatedStructure.negative_markers || [],
      color: generatedStructure.color || '#6c757d',
      icon: generatedStructure.icon || null,
      is_active: true,
    });

    res.status(201).json({
      success: true,
      data: direction,
      message: 'Direction generated and created successfully',
    });
  } catch (error: any) {
    console.error('❌ Ошибка при генерации и создании направления:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map((e: any) => e.message),
      });
    }
    
    res.status(500).json({
      error: 'Failed to generate and create direction',
      details: error.message,
    });
  }
};

/**
 * Получение пресетов маркеров
 */
export const getMarkerPresets = async (req: Request, res: Response) => {
  try {
    const presets = {
      illegal_casino: {
        visual: [
          { text: 'игровые автоматы', weight: 1.5 },
          { text: 'рулетка', weight: 1.5 },
          { text: 'покер', weight: 1.0 },
          { text: 'бездепозитный бонус', weight: 2.0 },
          { text: 'игровые слоты', weight: 1.5 },
          { text: 'казино онлайн', weight: 2.0 },
          { text: 'ставки на спорт', weight: 1.0 },
        ],
        negative: [
          { text: 'лицензия', weight: 2.0 },
          { text: 'ответственная игра', weight: 1.5 },
          { text: 'сертифицированное казино', weight: 2.5 },
          { text: 'легальное онлайн-казино', weight: 2.0 },
        ],
      },
      financial_pyramid: {
        visual: [
          { text: 'пирамида', weight: 2.5 },
          { text: 'матрица', weight: 2.0 },
          { text: 'MLM', weight: 2.0 },
          { text: 'реферальная программа', weight: 1.5 },
          { text: 'партнерская программа', weight: 1.5 },
          { text: 'пассивный доход', weight: 2.0 },
        ],
        negative: [
          { text: 'легальный бизнес', weight: 2.0 },
          { text: 'сертифицированный', weight: 1.5 },
          { text: 'лицензия', weight: 2.0 },
        ],
      },
      investment_scam: {
        visual: [
          { text: 'инвестиции', weight: 1.5 },
          { text: 'доход', weight: 1.5 },
          { text: 'прибыль', weight: 1.5 },
          { text: 'гарантированный доход', weight: 2.5 },
          { text: 'пассивный доход', weight: 2.0 },
          { text: 'графики', weight: 1.0 },
        ],
        negative: [
          { text: 'лицензия', weight: 2.0 },
          { text: 'регулятор', weight: 2.0 },
          { text: 'официальный', weight: 1.5 },
        ],
      },
      phishing: {
        visual: [
          { text: 'введите пароль', weight: 2.0 },
          { text: 'подтвердите данные карты', weight: 2.5 },
          { text: 'сброс пароля', weight: 1.5 },
          { text: 'верификация личности', weight: 2.0 },
          { text: 'безопасность аккаунта', weight: 1.5 },
        ],
        negative: [
          { text: 'официальный сайт', weight: 2.0 },
          { text: 'банк', weight: 1.5 },
          { text: 'SSL сертификат', weight: 2.0 },
        ],
      },
      drugs: {
        visual: [
          { text: 'закладки', weight: 2.5 },
          { text: 'скорость', weight: 2.0 },
          { text: 'экстази', weight: 2.5 },
          { text: 'мефедрон', weight: 2.5 },
          { text: 'гашиш', weight: 2.0 },
          { text: 'марихуана', weight: 2.0 },
        ],
        negative: [
          { text: 'лечение зависимости', weight: 2.0 },
          { text: 'помощь наркозависимым', weight: 2.0 },
          { text: 'реабилитационный центр', weight: 2.5 },
        ],
      },
    };

    res.json({
      success: true,
      data: presets,
    });
  } catch (error) {
    console.error('❌ Ошибка при получении пресетов маркеров:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Проверка статуса LLM сервера
 */
export const checkLLMStatus = async (req: Request, res: Response) => {
  try {
    const isAvailable = await LLMService.healthCheck();
    
    res.json({
      success: true,
      data: {
        available: isAvailable,
        host: process.env.LLM_HOST || '127.0.0.1',
        port: parseInt(process.env.LLM_PORT || '8080'),
        model: process.env.LLM_MODEL || 'gemma-4-E2B-it-Q3_K_M',
        status: isAvailable ? 'online' : 'offline',
      },
    });
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        available: false,
        status: 'error',
        error: error.message,
      },
    });
  }
};

/**
 * Прямая проверка LLM сервера с деталями
 */
export const testLLMConnection = async (req: Request, res: Response) => {
  try {
    const host = process.env.LLM_HOST || '127.0.0.1';
    const port = parseInt(process.env.LLM_PORT || '8080');
    
    // Проверяем базовое соединение
    let baseConnection = false;
    let healthCheck = false;
    let completionTest = false;
    let errorDetails = null;
    
    try {
      const baseRes = await axios.get(`http://${host}:${port}/`, { timeout: 3000 });
      baseConnection = baseRes.status === 200;
    } catch (err: any) {
      errorDetails = err.message;
    }
    
    try {
      const healthRes = await axios.get(`http://${host}:${port}/health`, { timeout: 3000 });
      healthCheck = healthRes.status === 200;
    } catch (err) {
      // /health может не существовать
    }
    
    // Тестовый запрос
    try {
      const testRes = await axios.post(
        `http://${host}:${port}/completion`,
        {
          prompt: 'Say "OK"',
          n_predict: 10,
          stream: false,
        },
        { timeout: 5000 }
      );
      completionTest = testRes.status === 200 && !!testRes.data.content;
    } catch (err) {
      // completion может требовать больше параметров
    }
    
    res.json({
      success: true,
      data: {
        host,
        port,
        baseConnection,
        healthCheck,
        completionTest,
        errorDetails,
        status: baseConnection ? 'online' : 'offline',
        config: {
          model: process.env.LLM_MODEL || 'gemma-4-E2B-it-Q3_K_M',
          temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
          maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
};