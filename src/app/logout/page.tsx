"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

const LogoutPage = () => {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: "/sign-in" });
  }, [signOut]);

  return (
    <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
      <span className="text-sm text-gray-500">Signing you out...</span>
    </div>
  );
};

export default LogoutPage;
