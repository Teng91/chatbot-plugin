import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
})

export function SearchIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14" />
    </svg>
  )
}

export function SendIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

export function TerminalIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 14H4V6h16zm-2-2h-6v-2h6zM7.5 8 6 9.5 8.5 12 6 14.5 7.5 16l4-4z" />
    </svg>
  )
}

export function BotIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3M7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5m7.5 5H9v-2h6zm-.5-3.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5" />
    </svg>
  )
}

export function CloseIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  )
}

export function ChatBubbleIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2" />
    </svg>
  )
}

export function ChevronDownIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </svg>
  )
}

export function ChevronUpIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
    </svg>
  )
}
