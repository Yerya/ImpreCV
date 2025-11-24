import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

export function PasswordEyeIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  )
}

export function PasswordEyeOffIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5.334 6.612C3.8 7.823 2.748 9.53 2.458 12c1.274 4.057 5.065 7 9.542 7a11.03 11.03 0 0 0 4.16-.808" />
      <path d="M9.019 7.594A7.64 7.64 0 0 1 12 7c4.477 0 8.268 2.943 9.542 7a10.7 10.7 0 0 1-2.903 4.24" />
      <path d="M9.88 9.88a3.25 3.25 0 0 1 4.24 4.24" />
      <path d="M12 15.25a3.25 3.25 0 0 1-3.25-3.25" />
      <path d="m4 4 16 16" />
    </svg>
  )
}
