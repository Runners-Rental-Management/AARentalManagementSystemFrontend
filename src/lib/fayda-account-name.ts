import type { FaydaPersonalInfo } from "@/lib/fayda-api";
import type { User } from "@/lib/types";

export type FaydaNameField = "firstName" | "fatherName";

export type FaydaAccountNameMismatch = {
  field: FaydaNameField;
  entered: string;
  expected: string;
};

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/** Father's name from registration is stored in `lastName`. */
export function getRegisteredFatherName(user: Pick<User, "lastName" | "fatherName">): string {
  return (user.fatherName?.trim() || user.lastName.trim());
}

export function getRegisteredNameSnapshot(
  user: Pick<User, "firstName" | "lastName" | "fatherName">,
): { firstName: string; fatherName: string } {
  return {
    firstName: user.firstName.trim(),
    fatherName: getRegisteredFatherName(user),
  };
}

export function compareFaydaNamesToAccount(
  info: FaydaPersonalInfo,
  user: Pick<User, "firstName" | "lastName" | "fatherName">,
): FaydaAccountNameMismatch[] {
  const expected = getRegisteredNameSnapshot(user);
  const mismatches: FaydaAccountNameMismatch[] = [];

  const enteredFirst = info.firstName.trim();
  const enteredFather = info.fatherName.trim();

  if (
    enteredFirst &&
    normalizeName(enteredFirst) !== normalizeName(expected.firstName)
  ) {
    mismatches.push({
      field: "firstName",
      entered: enteredFirst,
      expected: expected.firstName,
    });
  }

  if (
    enteredFather &&
    normalizeName(enteredFather) !== normalizeName(expected.fatherName)
  ) {
    mismatches.push({
      field: "fatherName",
      entered: enteredFather,
      expected: expected.fatherName,
    });
  }

  return mismatches;
}

export function faydaNamesMatchAccount(
  info: FaydaPersonalInfo,
  user: Pick<User, "firstName" | "lastName" | "fatherName">,
): boolean {
  return compareFaydaNamesToAccount(info, user).length === 0;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export function formatNameMismatchMessage(
  mismatches: FaydaAccountNameMismatch[],
  t: (key: string) => string,
): string {
  const lines = mismatches.map((m) => {
    const templateKey =
      m.field === "firstName" ? "nameMismatchFirst" : "nameMismatchFather";
    return interpolate(t(templateKey), {
      expected: m.expected,
      entered: m.entered,
    });
  });
  return `${t("nameMismatchIntro")} ${lines.join(" ")}`;
}
