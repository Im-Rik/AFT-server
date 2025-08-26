import bcrypt from 'bcryptjs';

export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const hashOtp = async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
};

export const compareOtp = async (otp, hashedOtp) => {
    return bcrypt.compare(otp, hashedOtp);
};