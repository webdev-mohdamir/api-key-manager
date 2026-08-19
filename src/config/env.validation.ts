import Joi from "joi";

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid("development", "production", "test", "provision")
        .default("development"),

    PORT: Joi.number().default(3000),

    DATABASE_URL: Joi.string().required(),

    POSTGRES_USER: Joi.string().required(),
    POSTGRES_PASSWORD: Joi.string().required(),
    POSTGRES_DB: Joi.string().required(),

    REDIS_HOST: Joi.string().default("redis"),
    REDIS_PORT: Joi.string().default("6379"),

    RATE_LIMIT_MAX: Joi.number().default(10),
    RATE_LIMIT_WINDOW_SECONDS: Joi.number().default(60),

    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_ACCESS_EXPIRY: Joi.number().default(3600), // 1 hour in seconds
    JWT_REFRESH_EXPIRY: Joi.number().default(86400 * 7), // 7 day in seconds
})