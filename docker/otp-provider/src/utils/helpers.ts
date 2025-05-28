export const generateOtpWithExpiry = () => {
  const otp = crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(-6);
  const otpExpiry = Date.now() + 5 * 60 * 1000; // Set OTP expiry time to 5 minutes
  return {
    otp,
    expiresAt: new Date(otpExpiry),
  };
};

export const isOtpValid = (otp: string, expiresAt: Date): boolean => {
  const currentTime = new Date();
  return otp.length === 6 && currentTime < expiresAt && /^\d+$/.test(otp);
};
