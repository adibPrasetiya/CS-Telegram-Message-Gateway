import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'CS').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const sendMessageSchema = Joi.object({
  sessionId: Joi.string().required(),
  message: Joi.string().required(),
  messageType: Joi.string().valid('TEXT', 'IMAGE', 'FILE', 'VIDEO', 'LINK').default('TEXT')
});

export const endSessionSchema = Joi.object({
  sessionId: Joi.string().required()
});