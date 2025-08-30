import { getUser } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  userProfileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();

      if (!user) {
        throw new Error("Unauthorised User");
      }

      return { id: user.id, email: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile image upload complete for user:", metadata.id);
      console.log("File URL:", file.ufsUrl);

      return {
        uploadedBy: metadata.id,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
