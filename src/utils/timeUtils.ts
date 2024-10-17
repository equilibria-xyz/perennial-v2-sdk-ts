import { formatDistanceToNowStrict, subDays } from 'date-fns'

export const Second = 1n
export const Minute = Second * 60n
export const Hour = Minute * 60n
export const Day = Hour * 24n
export const Year = Day * 365n

export function nowSeconds(): number
export function nowSeconds<T extends boolean | undefined>(asBigInt: T): T extends true ? bigint : number
export function nowSeconds(asBigInt?: boolean): bigint | number {
  const seconds = Math.floor(Date.now() / 1000)
  return (Boolean(asBigInt) ? BigInt(seconds) : seconds) as any
}

export function timeToSeconds(time: number | Date): number
export function timeToSeconds<T extends boolean | undefined>(
  time: number | Date,
  asBigInt: T,
): T extends true ? bigint : number
export function timeToSeconds(time: number | Date, asBigInt?: boolean): bigint | number {
  const seconds = Math.floor(new Date(time).getTime() / 1000)
  return (Boolean(asBigInt) ? BigInt(seconds) : seconds) as any
}

export const last24hrBounds = () => {
  const now = new Date()
  const yesterday = new Date(new Date().setDate(now.getDate() - 1))

  const to = Math.floor(now.setUTCHours(now.getUTCHours(), 59, 59, 999) / 1000)
  const from = Math.floor(yesterday.setUTCHours(yesterday.getUTCHours(), 0, 0, 0) / 1000)

  return { to, from }
}

export const last7dBounds = () => {
  const end = new Date()
  const start = subDays(end, 7)

  const to = Math.floor(end.setUTCHours(end.getUTCHours(), 59, 59, 999) / 1000)
  const from = Math.floor(start.setUTCHours(start.getUTCHours(), 0, 0, 0) / 1000)

  return { to, from }
}

export const formatDateRelative = (date: Date) => {
  const formatted = formatDistanceToNowStrict(date, { addSuffix: true })

  const shortFormMap: { [key: string]: string } = {
    second: 's',
    seconds: 's',

    minute: 'm',
    minutes: 'm',

    hour: 'h',
    hours: 'h',

    day: 'd',
    days: 'd',

    month: 'mo',
    months: 'mo',

    year: 'yr',
    years: 'yr',
  }

  return formatted.replace(
    / (seconds|second|minutes|minute|hours|hour|days|day|months|month|years|year)/g,
    (match) => shortFormMap[match.trim()],
  )
}
