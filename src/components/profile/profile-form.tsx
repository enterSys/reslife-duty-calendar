"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  allocatedBuilding: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    allocatedBuilding?: string | null
    profileImage?: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImage, setProfileImage] = useState(user.profileImage || "")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.name || "",
      email: user.email || "",
      allocatedBuilding: user.allocatedBuilding || "none",
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const payload = {
        ...data,
        allocatedBuilding: data.allocatedBuilding === "none" ? null : data.allocatedBuilding,
      }
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update profile")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Profile updated successfully")
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      // Update session data if possible
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    updateProfileMutation.mutate(data)
  }

  const handleImageUpload = (imageUrl: string) => {
    setProfileImage(imageUrl)
    queryClient.invalidateQueries({ queryKey: ["profile"] })
  }

  const handleImageRemove = async () => {
    try {
      const response = await fetch("/api/users/avatar", {
        method: "DELETE",
      })
      
      if (response.ok) {
        setProfileImage("")
        queryClient.invalidateQueries({ queryKey: ["profile"] })
        toast.success("Profile picture removed successfully")
      }
    } catch (error) {
      toast.error("Failed to remove profile picture")
    }
  }

  const buildings = [
    "Ashburne",
    "Sheavyn",
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Picture Upload */}
      <div className="space-y-2">
        <ImageUpload
          value={profileImage}
          onChange={handleImageUpload}
          onRemove={handleImageRemove}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            {...register("fullName")}
            placeholder="Enter your full name"
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allocatedBuilding">Allocated Building</Label>
        <Select
          value={watch("allocatedBuilding")}
          onValueChange={(value) => setValue("allocatedBuilding", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {buildings.map((building) => (
              <SelectItem key={building} value={building}>
                {building}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}