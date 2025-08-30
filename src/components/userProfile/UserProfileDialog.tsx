"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ImageCropper } from "@/components/userProfile/ImageCropper";
import {
  User,
  Key,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  CheckCircle,
  MailCheck,
  Send,
} from "lucide-react";
import { fileToDataUrl, blobToFile } from "@/lib/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import Image from "next/image";
import { DiscardConfirmDialog } from "@/components/dialogs/DiscardConfirmDialog";
import { UserData } from "@/types/types";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import equal from "fast-deep-equal";
import axios from "@/lib/axios";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData;
  updateUser: (userData: UserData) => Promise<boolean>;
  isUpdatingUserProfile?: boolean;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  user,
  updateUser,
  isUpdatingUserProfile,
}: UserProfileDialogProps) {
  const [localProfile, setLocalProfile] = useState<UserData>(user);
  const [initialProfile, setInitialProfile] = useState<UserData>(user);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>();
  const [newlyUploadedProfileImageUrl, setNewlyUploadedProfileImageUrl] =
    useState<string | undefined>(undefined);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const [isChangingUserName, setIsChangingUserName] = useState(false);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  // Account deletion state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Initialize UploadThing hook for profile image uploads
  const { startUpload, isUploading } = useUploadThing("userProfileImage", {
    headers: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session found.");
      }

      const token = session.access_token;

      return {
        authorization: `Bearer ${token}`,
      };
    },
    onUploadProgress: setUploadProgress,
    onClientUploadComplete: (res) => {
      console.log("✅ Upload completed:", res);
      if (res && res[0]) {
        const uploadedImageUrl = res[0].ufsUrl;
        console.log("🖼️ Uploaded image URL:", uploadedImageUrl);

        // Store the uploaded URL for later use when saving
        setNewlyUploadedProfileImageUrl(uploadedImageUrl);

        toast.success("Profile image uploaded successfully!");
      }
      setIsUploadingImage(false);
    },
    onUploadError: (error) => {
      toast.error("Failed to upload image: " + error.message);

      setUploadError(true);
      setIsUploadingImage(false);

      // Revert to previous image on error
      setLocalProfile((prev) => ({
        ...prev,
        profileImageUrl: initialProfile.avatarUrl,
      }));

      // Reset newly uploaded URL
      setNewlyUploadedProfileImageUrl(undefined);
      setTimeout(() => setUploadError(false), 2000);
    },
    onUploadBegin: (name) => {
      console.log("🚀 Upload started for:", name);
      setIsUploadingImage(true);
    },
  });

  // Update local and initial state when profile prop changes
  useEffect(() => {
    setLocalProfile(user);
    setInitialProfile(user);
    setNewlyUploadedProfileImageUrl(undefined);
  }, [user]);

  // Function to check for unsaved changes in basic profile info
  const hasUserProfileChanges = useCallback(() => {
    const currentBasicProfile = {
      name: localProfile.name,
      email: localProfile.email,
      avatarUrl:
        newlyUploadedProfileImageUrl !== undefined
          ? newlyUploadedProfileImageUrl
          : localProfile.avatarUrl,
    };

    const initialBasicProfile = {
      name: initialProfile.name,
      email: initialProfile.email,
      avatarUrl: initialProfile.avatarUrl,
    };

    // check if profile info changed
    const profileChanged = !equal(currentBasicProfile, initialBasicProfile);

    // check if password fields have values
    const passwordChanged =
      currentPassword.trim() !== "" ||
      newPassword.trim() !== "" ||
      confirmPassword.trim() !== "";

    return profileChanged || passwordChanged;
  }, [
    localProfile,
    initialProfile,
    newlyUploadedProfileImageUrl,
    currentPassword,
    newPassword,
    confirmPassword,
  ]);

  // Function to revert changes and close the dialog
  const handleDiscardAndClose = useCallback(() => {
    setLocalProfile(initialProfile); // Revert local state to initial
    setNewlyUploadedProfileImageUrl(undefined); // Clear pending uploaded image
    setShowDiscardConfirm(false); // Close confirmation dialog
    setIsChangingUserName(false);
    onOpenChange(false); // Close main dialog
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordSection(false);
  }, [initialProfile, onOpenChange]);

  useEffect(() => {
    if (!showPasswordSection) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [showPasswordSection]);

  // Intercept dialog close attempt
  const handleDialogCloseAttempt = (newOpenState: boolean) => {
    // If trying to close AND an update is in progress, do nothing
    if (
      !newOpenState &&
      (isUpdatingUserProfile ||
        isDeletingAccount ||
        isUploadingImage ||
        isChangingPassword ||
        isUploading)
    ) {
      return;
    }

    if (!newOpenState && hasUserProfileChanges()) {
      setShowDiscardConfirm(true); // Show confirmation if trying to close with changes
    } else {
      handleDiscardAndClose(); // Close directly if no changes or opening
    }
  };

  const handleSave = async () => {
    if (!localProfile.name.trim()) {
      toast.error("Username is required");

      return;
    }

    if (!localProfile.email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Combine local profile with newly uploaded image URL if available
    const profileToSave: UserData = {
      id: localProfile.id,
      name: localProfile.name,
      email: localProfile.email,
      isEmailVerified: localProfile.isEmailVerified,
      avatarUrl: newlyUploadedProfileImageUrl || localProfile.avatarUrl,
      createdAt: localProfile.createdAt,
    };

    const success = await updateUser(profileToSave); // Await the update
    if (success) {
      onOpenChange(false);
      setIsChangingUserName(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setSelectedImageSrc(dataUrl);
        setShowImageCropper(true);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
      } finally {
        e.target.value = "";
      }
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      console.log("🖼️ Crop completed, starting upload process...");

      // Convert blob to file for UploadThing
      const croppedFile = blobToFile(
        croppedImageBlob,
        `profile-${Date.now()}.jpg`
      );

      // Immediately update UI with optimistic data URL for instant feedback
      const reader = new FileReader();
      reader.onload = () => {
        const optimisticDataUrl = reader.result as string;

        setNewlyUploadedProfileImageUrl(undefined);
        setIsUploadingImage(true);
        setUploadProgress(0);

        setLocalProfile((prev) => ({
          ...prev,
          avatarUrl: optimisticDataUrl,
        }));

        console.log("🎯 Optimistic UI update applied");
      };
      reader.readAsDataURL(croppedImageBlob);

      // Close the cropper immediately
      setShowImageCropper(false);

      // Start the background upload
      console.log("📤 Starting background upload...");
      await startUpload([croppedFile]);
    } catch (error) {
      console.error("Error in crop complete:", error);

      toast.error("Failed to process cropped image");

      setIsUploadingImage(false);

      // Revert to previous image on error
      setLocalProfile((prev) => ({
        ...prev,
        avatarUrl: initialProfile.avatarUrl,
      }));

      // Reset newly uploaded URL
      setNewlyUploadedProfileImageUrl(undefined);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");

      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");

      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");

      return;
    }

    setIsChangingPassword(true);

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: localProfile.email,
        password: currentPassword,
      });

      if (verifyError) {
        toast.error("Current password is incorrect");

        setIsChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error("Failed to update password: " + updateError.message);
      } else {
        toast.success("Password updated successfully");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      }
    } catch (error) {
      console.error("Password change error:", error);

      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailVerification = async () => {
    if (localProfile.isEmailVerified) {
      toast.info("Email is already verified.");

      return;
    }

    setIsVerifyingEmail(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: localProfile.email,
      });

      if (error) {
        toast.error("Failed to send verification email: " + error.message);
      } else {
        setEmailVerificationSent(true);

        toast.success("Verification email sent successfully");
      }
    } catch (error) {
      console.error("Email verification error:", error);

      toast.error("Failed to send verification email");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeletingAccount(true);

    try {
      // Call our API to delete the account
      const token = localStorage.getItem("supabase_token");
      const response = await axios.delete("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const errorData = await response.data;
        throw new Error(errorData.error || "Failed to delete account");
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      localStorage.removeItem("supabase_token");

      toast.success("Account deleted successfully");

      router.push("/signup");
    } catch (error) {
      console.error("Account deletion error:", error);

      toast.error(
        "Failed to delete account: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogCloseAttempt}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              {
                <Avatar className="size-10">
                  <AvatarImage
                    src={localProfile.avatarUrl || ""}
                    alt={localProfile.name || localProfile?.email || "User"}
                  />
                  <AvatarFallback className="text-lg">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                      {localProfile.name ? (
                        localProfile.name.charAt(0).toUpperCase()
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                    </span>
                  </AvatarFallback>
                </Avatar>
              }
            </div>
            User Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your profile information, security settings, and account
            preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Image Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Profile Picture
            </Label>

            {localProfile.avatarUrl && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Image
                  src={localProfile.avatarUrl}
                  alt="Profile Preview"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Profile Picture</p>
                  <p className="text-xs text-muted-foreground">
                    {isUploadingImage
                      ? "Uploading new image..."
                      : "Click upload to change"}
                  </p>
                </div>
                {isUploadingImage ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-sm">{uploadProgress ?? 0}%</span>
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                ) : !uploadError ? (
                  newlyUploadedProfileImageUrl && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      New image ready to save
                    </div>
                  )
                ) : (
                  <div className="text-xs text-destructive">
                    Failed to upload image
                  </div>
                )}
              </div>
            )}

            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                id="profile-image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={
                  isUploadingImage ||
                  isUploading ||
                  showImageCropper ||
                  isDeletingAccount
                }
              />
              <Label
                htmlFor="profile-image-upload"
                className={cn(
                  "w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isUploadingImage || isUploading
                    ? "opacity-50 pointer-events-none cursor-not-allowed"
                    : "cursor-pointer"
                )}
              >
                {isUploadingImage || isUploading
                  ? "Processing..."
                  : "Upload Profile Picture"}
              </Label>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Image (4MB max) - Click &quot;Save Changes&quot; to apply
              </p>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </Label>

            <div className="space-y-2">
              <Label htmlFor="name">Username</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={localProfile.name}
                  onChange={(e) =>
                    setLocalProfile((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter username"
                  disabled={isUpdatingUserProfile || !isChangingUserName}
                />
                <Button
                  disabled={isUpdatingUserProfile || isDeletingAccount}
                  onClick={() => setIsChangingUserName(!isChangingUserName)}
                >
                  {isChangingUserName ? "Done" : "Edit"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={localProfile.email}
                  onChange={(e) =>
                    setLocalProfile((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Enter email address"
                  disabled={true}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleEmailVerification}
                  disabled={
                    isVerifyingEmail ||
                    emailVerificationSent ||
                    localProfile.isEmailVerified
                  }
                  className="shrink-0"
                >
                  {isVerifyingEmail ? (
                    "Sending..."
                  ) : emailVerificationSent ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Sent
                    </>
                  ) : localProfile.isEmailVerified ? ( // Show verified status
                    <>
                      <MailCheck className="w-4 h-4 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              {emailVerificationSent && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Verification email sent! Check your inbox.
                </p>
              )}
              {!localProfile.isEmailVerified && !emailVerificationSent && (
                <p className="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Email not verified.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Password Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Key className="w-4 h-4" />
                Password & Security
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                disabled={isChangingPassword || isDeletingAccount}
              >
                {showPasswordSection ? "Cancel" : "Change Password"}
              </Button>
            </div>

            {showPasswordSection && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      disabled={isChangingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={isChangingPassword}
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={isChangingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {(currentPassword || newPassword || confirmPassword) && (
                  <p className="text-sm text-red-500">
                    Click <strong>Change Password</strong> to continue and save
                    your changes.
                  </p>
                )}

                <Button
                  onClick={handlePasswordChange}
                  disabled={
                    isChangingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    isUploading ||
                    isUploadingImage ||
                    isDeletingAccount
                  }
                  className="w-full"
                >
                  {isChangingPassword
                    ? "Changing Password..."
                    : "Change Password"}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </Label>

            {!showDeleteConfirmation ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirmation(true)}
                className="w-full"
                disabled={isDeletingAccount || isUploading || isUploadingImage}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            ) : (
              <div className="space-y-4 p-4 border border-destructive rounded-lg bg-destructive/10">
                <div className="space-y-2">
                  <Label className="text-destructive font-medium">
                    This action cannot be undone. This will permanently delete
                    your account and all associated data.
                  </Label>
                  <Label htmlFor="delete-confirm">
                    Type &quot;DELETE&quot; to confirm:
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    disabled={isDeletingAccount}
                    className="bg-destructive/25"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setDeleteConfirmText("");
                    }}
                    disabled={isDeletingAccount}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={
                      isDeletingAccount || deleteConfirmText !== "DELETE"
                    }
                    className="flex-1"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() =>
              hasUserProfileChanges()
                ? setShowDiscardConfirm(true)
                : onOpenChange(false)
            }
            variant="outline"
            disabled={
              isUpdatingUserProfile ||
              isUploadingImage ||
              isChangingPassword ||
              isDeletingAccount
            }
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isUpdatingUserProfile ||
              !localProfile.name.trim() ||
              !localProfile.email.trim() ||
              !hasUserProfileChanges() ||
              isUploadingImage ||
              isUploading ||
              isDeletingAccount ||
              !isChangingPassword
            }
          >
            {isUpdatingUserProfile ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>

        {/* Image Cropper Dialog */}
        <ImageCropper
          open={showImageCropper}
          onOpenChange={setShowImageCropper}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          cropShape="round"
          title="Crop Profile Picture"
        />

        {/* Discard Confirmation Dialog */}
        <DiscardConfirmDialog
          open={showDiscardConfirm}
          onOpenChange={setShowDiscardConfirm}
          onConfirmDiscard={handleDiscardAndClose}
          onCancelDiscard={() => setShowDiscardConfirm(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
