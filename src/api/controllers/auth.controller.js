import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { authService } from '../../services/auth.service.js';
import { generateTokenForUser, generateRegistrationToken } from '../../services/token.service.js';
import { config } from '../../config/config.js';

const registerStepOne = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const signupToken = await authService.initiateSignup(name, email, password);

  res.status(200).json(
    new ApiResponse(
      200,
      { signupToken },
      'OTP sent to your email. Please verify to continue.'
    )
  );
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { otp, signupToken } = req.body;
  const verifiedUserDetails = await authService.verifySignupOtp(signupToken, otp);

  const registrationToken = generateRegistrationToken(verifiedUserDetails);

  res.status(200).json(
    new ApiResponse(
      200,
      { registrationToken },
      'OTP verified successfully. Please complete your registration.'
    )
  );
});

const checkUsernameAvailability = asyncHandler(async (req, res) => {
    const { username } = req.body;
    const isAvailable = await authService.isUsernameAvailable(username);
    res.status(200).json(new ApiResponse(200, { isAvailable }, 'Username availability checked.'));
});

const registerStepTwo = asyncHandler(async (req, res) => {
    const signupDetails = req.signupDetails; // From verifyRegistrationToken middleware
    const { username } = req.body;

    const createdUser = await authService.completeSignup(signupDetails, username);
    const token = generateTokenForUser(createdUser);

    const cookieOptions = {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000 * 90 // 90 days
    };

    const responsePayload = { user: createdUser, token };
    const isMobileClient = req.headers['x-client-type'] === 'mobile';

    if (isMobileClient) {
        return res.status(201).json(new ApiResponse(201, responsePayload, 'User created and signed in successfully.'));
    } else {
        return res.status(201).cookie('accessToken', token, cookieOptions).json(new ApiResponse(201, responsePayload, 'User created and signed in successfully.'));
    }
});

const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const user = await authService.loginUserByCredentials(identifier, password);
  const token = generateTokenForUser(user);
  const cookieOptions = { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000 * 90 };
  const responsePayload = { user, token };

  if (req.headers['x-client-type'] === 'mobile'){
    return res.status(200).json(new ApiResponse(200, responsePayload, 'Signed in successfully.'));
  } else {
    return res.status(200).cookie('accessToken', token, cookieOptions).json(new ApiResponse(200, responsePayload, 'Signed in successfully.'));
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).clearCookie('accessToken').json(new ApiResponse(200, {}, "User logged out successfully."));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.handleForgotPassword(email);

  res.status(200).json(
    new ApiResponse(200, null, 'If an account with that email exists, a password reset link has been sent.')
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);

  res.status(200).json(
    new ApiResponse(200, null, 'Password has been reset successfully.')
  );
});

export {
    registerStepOne,
    verifyOtp,
    checkUsernameAvailability,
    registerStepTwo,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
};