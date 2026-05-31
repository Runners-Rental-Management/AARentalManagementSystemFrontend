/**
 * Simulated Fayda (Ethiopian National ID) verification for development.
 * OTP request → masked phone → confirm code, then persisted via the backend API.
 */

export interface FaydaPersonalInfo {
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  faydaNumber: string;
}

export interface FaydaRequestResult {
  otpId: string;
  maskedPhone: string;
  expiresInSeconds: number;
}

export interface FaydaConfirmResult {
  fan: string;  
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  verifiedAt: string;
}

/** Demo verification code shown in the OTP step (no SMS is sent). */
export const FAYDA_DEMO_CODE = "123456";

const FAYDA_DEMO_OTPS = ["123456", "111111"] as const;
const FAN_REGEX = /^\d{16}$/;
const NAME_REGEX = /^[A-Za-z\u1200-\u137F][A-Za-z\u1200-\u137F\s'.-]{1,40}$/;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function isAcceptedDemoOtp(code: string): boolean {
  if (process.env.NODE_ENV === "production") {
    return code === FAYDA_DEMO_CODE;
  }
  return (FAYDA_DEMO_OTPS as readonly string[]).includes(code);
}

function maskPhoneFromFan(fan: string): string {
  const digits = fan.replace(/\D/g, "");
  const prefixes = ["1", "1", "2", "3", "4", "5", "6", "6", "7", "8"];
  const prefix = prefixes[parseInt(digits.slice(-1), 10)];
  return `+251 9${prefix}* *** ***`;
}

export async function requestFaydaVerification(
  info: FaydaPersonalInfo,
): Promise<FaydaRequestResult> {
  if (!NAME_REGEX.test(info.firstName.trim())) {
    throw new Error("invalid_first_name");
  }
  if (!NAME_REGEX.test(info.fatherName.trim())) {
    throw new Error("invalid_father_name");
  }
  if (!NAME_REGEX.test(info.grandfatherName.trim())) {
    throw new Error("invalid_grandfather_name");
  }
  const fan = info.faydaNumber.trim();
  if (!FAN_REGEX.test(fan)) {
    throw new Error("invalid_fayda_number");
  }

  return delay(
    {
      otpId: `fayda_otp_${Date.now()}`,
      maskedPhone: maskPhoneFromFan(fan),
      expiresInSeconds: 120,
    },
    900,
  );
}

export async function confirmFaydaCode(
  otpId: string,
  code: string,
  info: FaydaPersonalInfo,
): Promise<FaydaConfirmResult> {
  if (!otpId.startsWith("fayda_otp_")) {
    throw new Error("invalid_session");
  }
  if (!/^\d{6}$/.test(code)) {
    throw new Error("invalid_code_format");
  }
  if (!isAcceptedDemoOtp(code)) {
    await delay(null, 700);
    throw new Error("incorrect_code");
  }
  return delay(
    {
      fan: info.faydaNumber.trim(),
      firstName: info.firstName.trim(),
      fatherName: info.fatherName.trim(),
      grandfatherName: info.grandfatherName.trim(),
      verifiedAt: new Date().toISOString(),
    },
    700,
  );
}
