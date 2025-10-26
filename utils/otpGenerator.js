import otpGenerator from 'otp-generator';

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
export const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
};

/**
 * Generate OTP expiry time (10 minutes from now)
 * @returns {Date} - Expiry date
 */
export const generateOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

/**
 * Verify if OTP is valid and not expired
 * @param {string} inputOTP - OTP entered by user
 * @param {string} storedOTP - OTP stored in database
 * @param {Date} expiryTime - OTP expiry time
 * @returns {boolean} - Whether OTP is valid
 */
export const verifyOTP = (inputOTP, storedOTP, expiryTime) => {
  if (!inputOTP || !storedOTP || !expiryTime) {
    return false;
  }

  // Check if OTP has expired
  if (new Date() > expiryTime) {
    return false;
  }

  // Compare OTPs
  return inputOTP === storedOTP;
};
