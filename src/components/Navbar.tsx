import { currentUser } from "@clerk/nextjs/server";
import NavbarClient from "./NavbarClient";

const Navbar = async () => {
  const user = await currentUser();
  return (
    <NavbarClient
      firstName={user?.firstName!}
      lastName={user?.lastName!}
      role={user?.publicMetadata?.role as string}
    />
  );
};

export default Navbar;
