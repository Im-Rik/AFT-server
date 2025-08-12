import { ApiError } from '../../utils/ApiError.js';
import { config } from '../../config/config.js';

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  console.error("ERROR 💣:", err);

  const response = {
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  };

  return res.status(statusCode).json(response);
};

export { errorMiddleware };