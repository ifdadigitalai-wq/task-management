"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { LogOut, User, Phone, Lock, Save, ArrowLeft, Clock, BarChart3, CheckSquare, Camera } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Task } from "@/types";

type UserProfileProps = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    department?: string | null;
    joinedAt?: Date | string | null;
    avatarUrl?: string | null;
    role?: string | null;
  };
};

export default function ProfileForm({ user }: UserProfileProps) {
  const router = useRouter();
  const timeTheme = useTimeTheme();
  const toast = useToast();

  // Basic profile states
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Password reset states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Client stats calculations
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await fetch("/api/tasks");
        const payload = await res.json();
        if (payload.success) {
          setUserTasks(payload.data || []);
        }
      } catch (err) {
        console.error("Failed to load profile task stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    loadTasks();
  }, []);

  // FileReader avatar preview handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setSubmittingProfile(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          avatarUrl: avatarUrl || null,
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        toast.success("Profile updated successfully!");
        router.refresh();
      } else {
        toast.error(payload.error || "Failed to update profile.");
      }
    } catch (err) {
      toast.error("An error occurred during save.");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill out all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSubmittingPassword(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const payload = await res.json();
      if (payload.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(payload.error || "Password change failed.");
      }
    } catch (err) {
      toast.error("An error occurred resetting password.");
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  };

  // Stats Computations
  const totalAssigned = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.status === "DONE");
  const completedCount = completedTasks.length;

  // Average Completion Time
  let averageCompletionTimeText = "—";
  if (completedCount > 0) {
    const totalMinutes = completedTasks.reduce((acc, t) => {
      if (t.actualMinutes) return acc + t.actualMinutes;
      const start = new Date(t.createdAt).getTime();
      const end = new Date(t.updatedAt).getTime();
      return acc + Math.floor((end - start) / 60000);
    }, 0);
    const avgHrs = (totalMinutes / completedCount / 60).toFixed(1);
    averageCompletionTimeText = `${avgHrs}h avg`;
  }



  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Column 1: Profile card & Stats (Left) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm flex flex-col items-center text-center">
          {/* Avatar Section */}
          <div className="relative group mb-4">
            <UserAvatar src={avatarUrl} name={name || "User"} size="lg" />
            <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-md">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100 leading-tight">
            {name || "Unnamed"}
          </h2>
          <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-1">
            {user.role === "ADMIN" ? "Administrator" : (user.department || "Staff")}
          </p>
          <span className="mt-3 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {user.role} Account
          </span>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-850 my-6" />

          {/* Org details */}
          <div className="w-full text-left space-y-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-450 font-bold">Email Address</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>
            </div>
            {user.joinedAt && (
              <div className="flex justify-between">
                <span className="text-slate-455 font-bold">Joined Organization</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(user.joinedAt).toLocaleDateString([], { dateStyle: "medium" })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time stats section */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-4">
            Performance Statistics
          </h3>
          
          {statsLoading ? (
            <div className="text-center py-6 text-slate-400 text-xs">Calculating statistics...</div>
          ) : (
            <div className="space-y-4">
              {/* Stat card 1: Completion Ratio */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Task Completion</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {completedCount} / {totalAssigned} completed ({totalAssigned > 0 ? Math.round((completedCount/totalAssigned)*100) : 0}%)
                  </p>
                </div>
              </div>

              {/* Stat card 2: Average time */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Avg Completion Speed</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {averageCompletionTimeText}
                  </p>
                </div>
              </div>


            </div>
          )}
        </div>
      </div>

      {/* Column 2 & 3: Forms (Middle/Right) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Info Form */}
        <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            General Profile Information
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-455" />
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-850">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>

              <button
                type="submit"
                disabled={submittingProfile}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Security & Password Settings
          </h3>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
              <button
                type="submit"
                disabled={submittingPassword}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}