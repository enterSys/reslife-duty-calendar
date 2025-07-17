"use client"

import * as React from "react"
import { LogOut, Settings, User } from "lucide-react"
import { signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserAvatarProps {
  user: {
    name?: string | null
    email?: string | null
    allocatedBuilding?: string | null
    profileImage?: string | null
  }
}

export function UserAvatar({ user }: UserAvatarProps) {
  const router = useRouter()
  
  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/login" })
  }
  
  const handleProfileClick = () => {
    router.push("/profile")
  }
  
  const handleSettingsClick = () => {
    router.push("/profile")
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user.email?.charAt(0).toUpperCase() || "U"

  // Format name to show only first name and last initial
  const formatDisplayName = (name: string | null | undefined) => {
    if (!name) return "User"
    const parts = name.split(" ")
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium leading-none">
          {formatDisplayName(user.name)}
        </p>
        {user.allocatedBuilding && (
          <p className="text-xs leading-none text-muted-foreground mt-0.5">
            {user.allocatedBuilding}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 text-left"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.profileImage || `https://avatar.vercel.sh/${user.email}`}
                alt={user.name || user.email || "User"}
              />
              <AvatarFallback className="text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.button>
        </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {user.allocatedBuilding && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.allocatedBuilding}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}