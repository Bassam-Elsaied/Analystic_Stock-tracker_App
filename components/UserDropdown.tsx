"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { navItems } from "@/lib/data";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import NavItems from "./NavItems";

/**
 * Renders a user avatar trigger that opens a dropdown containing the user's info, navigation links, and a Sign Out action.
 *
 * The Sign Out item navigates the user to "/sign-in" when clicked.
 *
 * @returns A React element representing the user dropdown menu.
 */
function UserDropdown() {
  const router = useRouter();

  const handleSignOut = async () => {
    router.push("/sign-in");
  };

  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 text-gray-400 hover:bg-yellow-500"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
              {user.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-gray-400">
              {user.name}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-gray-500">
        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-400">
                {user.name}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="sm:hidden bg-gray-600" />

        <nav className="sm:hidden">
          <NavItems />
        </nav>

        <DropdownMenuSeparator className="bg-gray-600" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
        >
          <LogOut className="size-4 mr-2 hidden sm:block" />
          Sign Out
        </DropdownMenuItem>

        {/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {navItems.map((item) => (
          <DropdownMenuItem key={item.label}>{item.label}</DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;
