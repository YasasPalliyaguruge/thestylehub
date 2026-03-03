import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  CircleUserRound,
  ClipboardPenLine,
  Paintbrush2,
  Scissors,
  Sparkles,
  SprayCan,
  UserRound,
  WandSparkles,
} from 'lucide-react'

export type StepIconKey = 'service' | 'stylist' | 'datetime' | 'contact'

const serviceKeywordIconMap: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /beard|shav/i, icon: UserRound },
  { match: /color|balayage|ombre|highlight|fashion|dye/i, icon: Paintbrush2 },
  { match: /treatment|straight|relax|rebond|perm|scalp/i, icon: WandSparkles },
  { match: /style|setting|blow/i, icon: Sparkles },
  { match: /root|touch/i, icon: SprayCan },
  { match: /cut|trim|hair/i, icon: Scissors },
]

const legacyEmojiMap: Array<[string, LucideIcon]> = [
  ['??', Scissors],
  ['??', UserRound],
  ['??', WandSparkles],
  ['??', Paintbrush2],
  ['??', Paintbrush2],
  ['??', Sparkles],
  ['?????', Scissors],
  ['?????', Scissors],
  ['???', SprayCan],
]

export function getServiceIcon(name?: string | null, icon?: string | null, category?: string | null): LucideIcon {
  if (icon) {
    const legacy = legacyEmojiMap.find(([value]) => value === icon)
    if (legacy) return legacy[1]
  }

  const source = `${name || ''} ${category || ''}`
  const byKeyword = serviceKeywordIconMap.find((entry) => entry.match.test(source))

  return byKeyword?.icon || Scissors
}

export function getStepIcon(step: StepIconKey): LucideIcon {
  if (step === 'service') return Scissors
  if (step === 'stylist') return CircleUserRound
  if (step === 'datetime') return CalendarDays
  return ClipboardPenLine
}
