import { ZodType } from "zod";
import AppError from "./AppError";

function validate<T>(schema: ZodType<T>, data: unknown) {
  const res = schema.safeParse(data)
  if (!res.success) throw new AppError(res.error.message || '똑바로 입력하세요')
  return res.data
}

export default validate
