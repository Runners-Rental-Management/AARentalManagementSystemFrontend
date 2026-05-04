/**
 * Simulated Fayda (Ethiopian National ID) verification API.
 *
 * In production this would call the real Fayda eKYC endpoints. For the demo
 * we mimic the same shape: a request returns an OTP transaction id and a
 * masked phone number, and confirmation accepts a 6-digit short code.
 *
 * For convenience the demo always accepts the code "123456". Any other
 * 6-digit code is rejected so the UX of the OTP step can be tested.
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

const DEMO_OTP = "123456";
const FAN_REGEX = /^\d{16}$/;
const NAME_REGEX = /^[A-Za-z\u1200-\u137F][A-Za-z\u1200-\u137F\s'.-]{1,40}$/;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Deterministically derive a masked Ethiopian phone number from a FAN.
 *
 * Real format:  +251 9XX XXX XXX  (9 digits after country code)
 * Masked:       +251 9X* *** ***
 *
 * Only one digit — the carrier prefix (the digit immediately after the leading
 * 9, e.g. "1" for Ethio Telecom, "6" for Safaricom) — is revealed. This lets
 * the user recognise their network without exposing any of the right-side
 * digits.  The prefix is derived deterministically from the last digit of the
 * FAN so every unique FAN maps to a consistent masked number.
 */
function maskPhoneFromFan(fan: string): string {
  const digits = fan.replace(/\D/g, "");
  // Map last FAN digit → carrier prefix digit (0-9 → one of the real prefixes)
  const prefixes = ["1", "1", "2", "3", "4", "5", "6", "6", "7", "8"];
  const prefix = prefixes[parseInt(digits.slice(-1), 10)];
  return `+251 9${prefix}* *** ***`;
}

export async function requestFaydaVerification(
  info: FaydaPersonalInfo
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
    900
  );
}

export async function confirmFaydaCode(
  otpId: string,
  code: string,
  info: FaydaPersonalInfo
): Promise<FaydaConfirmResult> {
  if (!otpId.startsWith("fayda_otp_")) {
    throw new Error("invalid_session");
  }
  if (!/^\d{6}$/.test(code)) {
    throw new Error("invalid_code_format");
  }
  if (code !== DEMO_OTP) {
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
    700
  );
}

export const FAYDA_DEMO_CODE = DEMO_OTP;
