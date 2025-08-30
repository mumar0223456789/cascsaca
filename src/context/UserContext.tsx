"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { UserData } from "@/types/types";
import axios from "@/lib/axios";
import { toast } from "sonner";

interface UserContextType {
  user: UserData | null;
  updateUser: (newProfile: UserData) => Promise<boolean>;
  isUpdatingUserProfile: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
  initialUser: UserData | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const [user, setUser] = useState<UserData | null>(initialUser);
  const [isUpdatingUserProfile, setIsUpdatingUserProfile] = useState(false);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const updateUser = useCallback(
    async (newProfile: UserData): Promise<boolean> => {
      try {
        setIsUpdatingUserProfile(true);

        const response = await axios.post(
          "/api/update-user-profile",
          newProfile
        );

        if (response.status === 200) {
          const { profile: updatedProfile } = response.data;

          setUser({
            id: updatedProfile.id,
            email: updatedProfile.email,
            name: updatedProfile.name,
            avatarUrl: updatedProfile.avatarUrl,
            isEmailVerified: user?.isEmailVerified || false,
            createdAt: user?.createdAt || new Date().toISOString(),
          });

          toast.success("Profile updated successfully");
          return true;
        } else {
          throw new Error(response.data.error || "Failed to update profile");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : (error as { response?: { data?: { error?: string } } })?.response
                ?.data?.error || "An unknown error occurred";
        console.error("Error updating profile:", errorMessage);
        toast.error("Failed to update profile");
        return false;
      } finally {
        setIsUpdatingUserProfile(false);
      }
    },
    [user]
  );

  const value = React.useMemo(
    () => ({
      user,
      updateUser,
      isUpdatingUserProfile,
    }),
    [user, updateUser, isUpdatingUserProfile]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
