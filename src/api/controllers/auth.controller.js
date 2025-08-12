import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { authService } from '../../services/auth.service.js';
import { generateTokenForUser } from '../../services/token.service.js';
import { config } from '../../config/config.js';

const signup = asyncHandler(async (req, res) => {
  const { name, email, username, password } = req.body;
  const createdUser = await authService.signupUser(name, email, username, password);

  res.status(201).json(
    new ApiResponse(201, createdUser, 'User created successfully.')
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const user = await authService.loginUserByCredentials(identifier, password);
  const token = generateTokenForUser(user);

  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  };

  res
    .status(200)
    .cookie('accessToken', token, cookieOptions)
    .json(
      new ApiResponse(200, { user, token }, 'Signed in successfully.')
    );
});

export { signup, loginUser };