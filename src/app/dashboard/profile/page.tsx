"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { apiChangePassword, apiUpdateMe, getAccessToken } from "@/lib/api";
import { getInitials, formatDate } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  CreditCard,
  Save,
  Fingerprint,
  CheckCircle2,
  Clock,
  LockKeyhole,
  BadgeCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";

function ReadOnlyField({
  icon: Icon,
  label,
  value,
  mono = false,
  masked = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
  mono?: boolean;
  masked?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  const display = value || "—";
  const maskedDisplay =
    masked && !revealed && value
      ? value.slice(0, 4) + " **** **** " + value.slice(-4)
      : display;

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 select-all ${
            mono ? "font-mono tracking-wider" : ""
          }`}
        >
          {masked ? maskedDisplay : display}
        </div>
        {masked && value && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-colors"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user: currentUser, refreshUser } = useAuth();
  const [address, setAddress] = useState("");
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [credentialEmail, setCredentialEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setAddress(currentUser.address ?? "");
    setCredentialEmail(currentUser.email);
  }, [currentUser]);

  const handleSaveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    const token = getAccessToken();
    if (!token) {
      setAccountError("Please sign in again.");
      return;
    }
    setAccountError(null);
    setAccountMessage(null);
    setSavingAddress(true);
    try {
      await apiUpdateMe(token, { address });
      await refreshUser();
      setAccountMessage("Address updated successfully.");
    } catch (error) {
      setAccountError(
        error instanceof Error ? error.message : "Failed to update address.",
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    setPasswordError(null);
    setPasswordMessage(null);

    if (credentialEmail.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      setPasswordError("Email credential must match your account email.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setPasswordError("Please sign in again.");
      return;
    }

    setSavingPassword(true);
    try {
      await apiChangePassword(token, {
        email: credentialEmail,
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated successfully.");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Failed to update password.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (!currentUser) return null;

  const isFaydaVerified = !!currentUser.faydaVerified;

  const formatFan = (fan: string) =>
    fan.replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  return (
    <>
      <Header title={t("profilePage", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Profile Header */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                {getInitials(`${currentUser.firstName} ${currentUser.lastName}`)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  {currentUser.firstName} {currentUser.lastName}
                </h2>
                <p className="text-sm text-stone-500 capitalize">
                  {t("roles", currentUser.role)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {isFaydaVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Fayda Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      Identity Unverified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
                    <Calendar className="w-3.5 h-3.5" />
                    Member since {formatDate(currentUser.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fayda Identity Card — read-only */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-primary-50 to-primary-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
                  <Fingerprint className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Fayda Identity
                  </h3>
                  <p className="text-xs text-stone-500">
                    Verified via the National ID registry · Read-only
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isFaydaVerified
                    ? "text-emerald-700 bg-emerald-100"
                    : "text-stone-500 bg-stone-100"
                }`}
              >
                {isFaydaVerified ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    Not verified
                  </>
                )}
              </span>
            </div>

            <div className="p-6">
              {isFaydaVerified ? (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <ReadOnlyField
                      icon={User}
                      label="First Name"
                      value={currentUser.firstName}
                    />
                    <ReadOnlyField
                      icon={User}
                      label="Father's Name"
                      value={currentUser.fatherName}
                    />
                    <ReadOnlyField
                      icon={User}
                      label="Grandfather's Name"
                      value={currentUser.grandfatherName}
                    />
                  </div>

                  <ReadOnlyField
                    icon={Fingerprint}
                    label="Fayda Authentication Number (FAN)"
                    value={
                      currentUser.faydaNumber
                        ? formatFan(currentUser.faydaNumber)
                        : undefined
                    }
                    mono
                    masked
                  />

                  {currentUser.faydaVerifiedAt && (
                    <div className="flex items-center gap-2 text-xs text-stone-500 pt-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      Identity verified on{" "}
                      <span className="font-medium text-stone-700">
                        {new Date(currentUser.faydaVerifiedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                    <LockKeyhole className="w-7 h-7 text-stone-400" />
                  </div>
                  <p className="text-sm font-semibold text-stone-700 mb-1">
                    Identity not verified yet
                  </p>
                  <p className="text-xs text-stone-500 max-w-xs">
                    Your Fayda details will appear here after you complete
                    identity verification.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Information — address editable */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900 mb-5">
              Account Information
            </h3>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 mb-1">
                    <User className="w-4 h-4 text-stone-400" />
                    First Name (read-only)
                  </label>
                  <input
                    type="text"
                    value={currentUser.firstName}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 mb-1">
                    <User className="w-4 h-4 text-stone-400" />
                    Last Name (read-only)
                  </label>
                  <input
                    type="text"
                    value={currentUser.lastName}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 mb-1">
                  <Mail className="w-4 h-4 text-stone-400" />
                  Email Address (read-only)
                </label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500 cursor-not-allowed"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 mb-1">
                    <Phone className="w-4 h-4 text-stone-400" />
                    Phone Number (read-only)
                  </label>
                  <input
                    type="tel"
                    value={currentUser.phone}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 mb-1">
                    <CreditCard className="w-4 h-4 text-stone-400" />
                    ID Number
                  </label>
                  <input
                    type="text"
                    value={currentUser.idNumber ?? ""}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 mb-1">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  placeholder="Enter your current address"
                />
              </div>

              {accountError && <p className="text-sm text-rose-600">{accountError}</p>}
              {accountMessage && (
                <p className="text-sm text-emerald-600">{accountMessage}</p>
              )}

              <div className="pt-4 border-t border-stone-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">
              Change Password
            </h3>
            <p className="text-sm text-stone-500 mb-5">
              For security, enter your account email and current password before
              setting a new password.
            </p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Account Email Credential
                  </label>
                  <input
                    type="email"
                    value={credentialEmail}
                    onChange={(event) => setCredentialEmail(event.target.value)}
                    autoComplete="email"
                    placeholder={currentUser.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  />
                </div>
              </div>
              {passwordError && <p className="text-sm text-rose-600">{passwordError}</p>}
              {passwordMessage && (
                <p className="text-sm text-emerald-600">{passwordMessage}</p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    savingPassword ||
                    !credentialEmail.trim() ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="px-5 py-2.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </>
  );
}
