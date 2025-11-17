"use client";

/**
 * User Profile & Settings Page
 * 
 * Allows users to:
 * - View and edit their profile (name, email, avatar)
 * - Manage connected OAuth accounts
 * - View subscription and credits summary
 * - Delete account
 */

import { api } from "@/lib/trpc/react";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Image as ImageIcon,
  Save,
  Loader2,
  Trash2,
  Link as LinkIcon,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AppLayout } from "@/components/AppLayout";

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  apple: "Apple",
  amazon: "Amazon",
  ebay: "eBay",
  email: "Email",
};

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = api.user.getProfile.useQuery();
  const { data: connectedAccounts } = api.user.getConnectedAccounts.useQuery();
  const { data: subscription } = api.subscription.get.useQuery();
  const { data: credits } = api.subscription.getCredits.useQuery();

  // Initialize form when profile loads
  useEffect(() => {
    if (profile && !isEditing) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setImage(profile.image || null);
    }
  }, [profile, isEditing]);

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const deleteAccount = api.user.deleteAccount.useMutation({
    onSuccess: async () => {
      toast.success("Account deleted successfully");
      await signOut({ callbackUrl: "/" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  const deleteConnectedAccount = api.user.deleteConnectedAccount.useMutation({
    onSuccess: () => {
      toast.success("Account disconnected successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disconnect account");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Valid email is required");
      return;
    }

    updateProfile.mutate({
      name: name.trim(),
      email: email.trim(),
      image: image,
    });
  };

  const handleDeleteAccount = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    deleteAccount.mutate({ confirm: true });
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Failed to load profile</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Profile & Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {image ? (
                    <img
                      src={image}
                      alt={name || "Profile"}
                      className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-blue-600 text-2xl font-bold text-white border-4 border-gray-200 dark:border-gray-700">
                      {name?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => {
                        // TODO: Implement image upload
                        toast.info("Image upload coming soon!");
                      }}
                      className="absolute bottom-0 right-0 rounded-full bg-amber-500 p-2 text-white shadow-lg hover:bg-amber-600 transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile Picture</p>
                  {isEditing && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Click the camera icon to upload a new image
                    </p>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <User className="mr-2 inline h-4 w-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Your name"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{name || "Not set"}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Mail className="mr-2 inline h-4 w-4" />
                  Email Address
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="your@email.com"
                    />
                    {profile.emailVerified && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Email verified
                      </p>
                    )}
                    {!profile.emailVerified && (
                      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                        Email not verified. Check your inbox for verification link.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-900 dark:text-white">{email}</p>
                    {profile.emailVerified ? (
                      <p className="mt-1 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">Not verified</p>
                    )}
                  </div>
                )}
              </div>

              {/* Member Since */}
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-gray-900 dark:text-white">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Save/Cancel Buttons */}
              {isEditing && (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-blue-600 px-6 py-2 font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setName(profile.name || "");
                      setEmail(profile.email || "");
                      setImage(profile.image || null);
                    }}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-2 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subscription & Credits Summary */}
          <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Subscription & Credits</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {subscription?.plan || "FREE"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Credit Balance</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {credits?.balance || 0} credits
                </p>
              </div>
            </div>
            <Link
              href="/billing"
              className="mt-4 inline-block text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Manage subscription →
            </Link>
          </div>

          {/* Connected Accounts */}
          <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Connected Accounts</h2>
            {connectedAccounts && connectedAccounts.length > 0 ? (
              <div className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <LinkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {PROVIDER_NAMES[account.provider] || account.provider}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Connected via {account.type}
                        </p>
                      </div>
                    </div>
                    {connectedAccounts.length > 1 && (
                      <button
                        onClick={() => deleteConnectedAccount.mutate({ accountId: account.id })}
                        disabled={deleteConnectedAccount.isPending}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        <Unlink className="h-4 w-4" />
                        Disconnect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No connected accounts</p>
            )}
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-6">
            <h2 className="mb-4 text-2xl font-bold text-red-900 dark:text-red-400">Danger Zone</h2>
            <div className="space-y-4">
              <div>
                <p className="mb-2 font-semibold text-red-900 dark:text-red-400">Delete Account</p>
                <p className="mb-4 text-sm text-red-700 dark:text-red-300">
                  Once you delete your account, there is no going back. This will permanently delete your
                  account, projects, brand kits, and all associated data.
                </p>
                {showDeleteConfirm ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccount.isPending}
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteAccount.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Confirm Delete
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

