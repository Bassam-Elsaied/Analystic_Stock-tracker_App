"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * Avatar root component that applies consistent styling and exposes a predictable data slot.
 *
 * Renders a Radix AvatarPrimitive.Root with default size, layout, and rounded styling, merges any
 * provided `className` with the defaults, and forwards all other props to the underlying primitive.
 *
 * @param className - Additional CSS class names merged with the component's default classes
 * @param props - Additional props forwarded to AvatarPrimitive.Root
 * @returns The configured AvatarPrimitive.Root element
 */
function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders an avatar image element with preset square sizing and merged class names.
 *
 * @param className - Additional CSS classes to merge with the default "aspect-square size-full"
 * @returns The configured AvatarPrimitive.Image element with `data-slot="avatar-image"`
 */
function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

/**
 * Renders a styled fallback avatar element displayed when the avatar image is missing or fails to load.
 *
 * @param className - Additional CSS class names to merge with the component's default styling.
 * @returns A React element representing the avatar fallback content.
 */
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
