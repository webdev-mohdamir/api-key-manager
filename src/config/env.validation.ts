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
})