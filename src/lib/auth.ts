import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { UserData } from "../types/types";

export async function getUser(): Promise<UserData | null> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const isEmailVerified = !!user.email_confirmed_at;

    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        email: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      console.error("User not found in database:", user.id);
      return null;
    }

    return {
      ...dbUser,
      isEmailVerified: isEmailVerified,
      createdAt: dbUser.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}
