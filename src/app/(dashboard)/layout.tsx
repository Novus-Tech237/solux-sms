import Logo from "@/components/Logo";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex dark:bg-gray-950">
      {/* LEFT */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 dark:bg-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-center">
          <Logo />
        </div>

        {/**Institution Name */}
        <div className="mt-4 md:block hidden">
          <span className="text-sm text-slate-500 text-center">Queensway International College</span>
        </div>
        <Menu />
      </div>
      {/* RIGHT */}
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] dark:bg-gray-950 dark:text-gray-100 overflow-y-auto flex flex-col">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
