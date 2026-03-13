'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { getServiceIcon, getStepIcon, type StepIconKey } from '@/lib/icon-map'

interface ServiceItem {
  id: string
  name: string
  price: number
  icon: string | null
  popular?: boolean
  category: string
  active: boolean
}

interface TeamMemberApi {
  id: string
  name: string
  role: string
  specialties: unknown
  bio: string | null
  experience: number | null
  rating: number | null
  clients: number | null
}

interface TeamMember {
  id: string
  name: string
  role: string
  specialties: string[]
  bio: string | null
  experience: number | null
  rating: number | null
  clients: number | null
}

const bookingSchema = z.object({
  services: z.array(z.object({ id: z.string(), name: z.string(), price: z.number() })).min(1, 'Please select at least one service'),
  stylist: z.string().min(1, 'Please select a stylist'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(7, 'Please enter a valid phone number').max(20, 'Phone number is too long'),
})

type BookingFormData = z.infer<typeof bookingSchema>

const steps: Array<{ id: StepIconKey; title: string; detail: string }> = [
  { id: 'service', title: 'Services', detail: 'Choose the services you want included.' },
  { id: 'stylist', title: 'Stylist', detail: 'Match with the stylist who fits your look.' },
  { id: 'datetime', title: 'Schedule', detail: 'Pick the day and time that suits you.' },
  { id: 'contact', title: 'Details', detail: 'Confirm contact information and review everything.' },
]

const timeSlots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM']
const dates = Array.from({ length: 14 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() + index + 1)
  return date
})

function normalizeSpecialties(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

function formatDateForValue(date: Date) {
  return date.toISOString().split('T')[0]
}

function formatDateForDisplay(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatLongDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function findMappedService(services: ServiceItem[], planService: string, gender: 'men' | 'women' = 'men') {
  const normalized = planService.toLowerCase()
  const matchers: Array<(service: ServiceItem) => boolean> = [
    (service) => normalized === 'haircut' && gender === 'men' && service.name.toLowerCase().includes('gent') && service.name.toLowerCase().includes('haircut'),
    (service) => normalized === 'haircut' && gender === 'women' && service.name.toLowerCase().includes('lady') && service.name.toLowerCase().includes('haircut'),
    (service) => normalized === 'precision cut' && service.name.toLowerCase().includes('haircut'),
    (service) => normalized.includes('beard') && service.category === 'beard',
    (service) => normalized.includes('color') && service.category === 'color',
    (service) => normalized.includes('treatment') && service.category === 'treatment',
    (service) => normalized.includes('style') && service.name.toLowerCase().includes('setting'),
    (service) => normalized.includes('blow') && service.name.toLowerCase().includes('setting'),
    (service) => normalized.includes('wash') && service.name.toLowerCase().includes('setting'),
    (service) => normalized.includes('perm') && service.name.toLowerCase().includes('perm'),
    (service) => normalized.includes('hot towel') && service.name.toLowerCase().includes('shav'),
  ]
  for (const matcher of matchers) {
    const match = services.find(matcher)
    if (match) return match
  }
  return services.find((service) => {
    const name = service.name.toLowerCase()
    return name.includes(normalized) || normalized.includes(name)
  })
}

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([])
  const [selectedPackageName, setSelectedPackageName] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dataError, setDataError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { services: [], stylist: '', date: '', time: '', name: '', email: '', phone: '' },
  })

  const formData = watch()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesResponse, teamResponse] = await Promise.all([fetch('/api/public/services'), fetch('/api/public/team')])
        const servicesPayload = await servicesResponse.json()
        const teamPayload = await teamResponse.json()

        if (servicesPayload.success && Array.isArray(servicesPayload.data)) {
          setServices(
            servicesPayload.data.map((service: ServiceItem & { price: string | number | null }) => ({
              ...service,
              price: typeof service.price === 'string' ? parseFloat(service.price) : service.price || 0,
            }))
          )
        } else {
          setDataError('Failed to load services.')
        }

        if (teamPayload.success && Array.isArray(teamPayload.data)) {
          setTeam(
            teamPayload.data.map((member: TeamMemberApi) => ({
              id: member.id,
              name: member.name,
              role: member.role,
              specialties: normalizeSpecialties(member.specialties),
              bio: member.bio,
              experience: member.experience,
              rating: member.rating,
              clients: member.clients,
            }))
          )
        } else {
          setDataError('Failed to load stylists.')
        }
      } catch (error) {
        console.error('Error fetching booking data:', error)
        setDataError('Failed to load booking data. Please refresh the page.')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!team.length) return

    const applyPreselectedStylist = (stylistName: string) => {
      if (team.some((member) => member.name === stylistName)) {
        setValue('stylist', stylistName)
        setCurrentStep(0)
      }
    }

    const preselectedStylist = sessionStorage.getItem('preselectedStylist')
    if (preselectedStylist) {
      applyPreselectedStylist(preselectedStylist)
      sessionStorage.removeItem('preselectedStylist')
    }

    const handlePreselectStylist = (event: Event) => {
      const detail = (event as CustomEvent<{ stylist?: string }>).detail
      if (detail?.stylist) applyPreselectedStylist(detail.stylist)
    }

    window.addEventListener('preselectStylist', handlePreselectStylist)
    return () => window.removeEventListener('preselectStylist', handlePreselectStylist)
  }, [setValue, team])

  useEffect(() => {
    if (!services.length) return

    const applyPreselectedServices = (serviceNames: string[], packageName?: string, gender?: 'men' | 'women') => {
      const matched: ServiceItem[] = []
      for (const serviceName of serviceNames) {
        const match = findMappedService(services, serviceName, gender)
        if (match && !matched.some((entry) => entry.id === match.id)) matched.push(match)
      }
      setSelectedPackageName(packageName || null)
      setSelectedServices(matched)
      setValue('services', matched)
      setCurrentStep(0)
    }

    const preselectedServices = sessionStorage.getItem('preselectedServices')
    const preselectedPackage = sessionStorage.getItem('preselectedPackage')
    const preselectedGender = sessionStorage.getItem('preselectedGender') as 'men' | 'women' | null
    if (preselectedServices) {
      try {
        applyPreselectedServices(JSON.parse(preselectedServices), preselectedPackage || undefined, preselectedGender || undefined)
      } catch (error) {
        console.error('Failed to parse preselected services:', error)
      }
    }

    const handlePreselectServices = (event: Event) => {
      const detail = (event as CustomEvent<{ services?: string[]; packageName?: string; gender?: 'men' | 'women' }>).detail
      if (detail?.services) applyPreselectedServices(detail.services, detail.packageName, detail.gender)
    }

    window.addEventListener('preselectServices', handlePreselectServices)
    return () => window.removeEventListener('preselectServices', handlePreselectServices)
  }, [services, setValue])

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!formData.stylist || !formData.date) {
        setBookedSlots([])
        return
      }

      setIsLoadingAvailability(true)
      try {
        const response = await fetch(`/api/availability?stylist=${encodeURIComponent(formData.stylist)}&date=${formData.date}`)
        if (!response.ok) {
          setBookedSlots([])
          return
        }

        const payload = await response.json()
        const slots = Array.isArray(payload.bookedSlots) ? payload.bookedSlots : []
        setBookedSlots(slots)

        if (formData.time && slots.includes(formData.time)) {
          setValue('time', '')
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error)
        setBookedSlots([])
      } finally {
        setIsLoadingAvailability(false)
      }
    }

    fetchAvailability()
  }, [formData.date, formData.stylist, formData.time, setValue])

  const totalPrice = useMemo(() => formData.services?.reduce((sum, service) => sum + service.price, 0) || 0, [formData.services])

  const isStepComplete = (stepIndex: number) => {
    if (stepIndex === 0) return (formData.services?.length || 0) > 0
    if (stepIndex === 1) return !!formData.stylist
    if (stepIndex === 2) return !!(formData.date && formData.time)
    return false
  }

  const canMoveNext =
    (currentStep === 0 && (formData.services?.length || 0) > 0) ||
    (currentStep === 1 && !!formData.stylist) ||
    (currentStep === 2 && !!(formData.date && formData.time))

  const toggleService = (service: ServiceItem) => {
    const exists = selectedServices.some((entry) => entry.id === service.id)
    const nextServices = exists ? selectedServices.filter((entry) => entry.id !== service.id) : [...selectedServices, service]
    setSelectedServices(nextServices)
    setValue('services', nextServices)
  }

  const nextStep = () => {
    if (!canMoveNext || currentStep >= steps.length - 1) return
    if (currentStep === 0 && formData.stylist) {
      setCurrentStep(2)
      return
    }
    setCurrentStep((value) => value + 1)
  }

  const prevStep = () => {
    if (currentStep === 0) return
    if (currentStep === 2 && formData.stylist) {
      setCurrentStep(0)
      return
    }
    setCurrentStep((value) => value - 1)
  }

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to complete booking')
      setIsSuccess(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBookAnother = () => {
    setIsSuccess(false)
    setCurrentStep(0)
    setSelectedServices([])
    setSelectedPackageName(null)
    setBookedSlots([])
    setErrorMessage('')
    reset({ services: [], stylist: '', date: '', time: '', name: '', email: '', phone: '' })
  }

  if (isLoadingData) {
    return (
      <section id="booking" className="py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold-primary/25 text-gold-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <p className="mt-4 text-gray-400">Loading booking experience...</p>
        </div>
      </section>
    )
  }

  if (dataError) {
    return (
      <section id="booking" className="py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <p className="text-red-400">{dataError}</p>
          <p className="mt-2 text-gray-500">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  if (isSuccess) {
    return (
      <SectionWrapper id="booking" className="section-shell py-28 md:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <motion.div className="public-panel overflow-hidden p-8 text-center md:p-12" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-primary text-black shadow-[0_0_36px_rgba(212,175,55,0.28)]">
              <Check className="h-9 w-9" />
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.26em] text-gold-primary">Booking Confirmed</p>
            <h2 className="mt-4 text-4xl font-semibold text-white">Your appointment is reserved.</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-300">
              We have sent a confirmation email to {formData.email}. Your stylist and service selections are saved and ready for your visit.
            </p>

            <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
              <div className="public-card p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Appointment</p>
                <p className="mt-3 text-lg font-medium text-white">{formatLongDate(formData.date)}</p>
                <p className="mt-2 text-sm text-gold-primary">{formData.time}</p>
                <p className="mt-2 text-sm text-gray-300">Stylist: {formData.stylist}</p>
              </div>
              <div className="public-card p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Selected Services</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  {formData.services?.map((service) => (
                    <li key={service.id} className="flex items-center justify-between gap-4">
                      <span>{service.name}</span>
                      <span className="text-gold-primary">LKR {service.price.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button type="button" onClick={handleBookAnother} className="mt-8 inline-flex items-center justify-center rounded-full border border-gold-primary/25 px-6 py-3 text-sm font-semibold text-gold-primary transition-colors hover:bg-gold-primary/10">
              Book Another Appointment
            </button>
          </motion.div>
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper id="booking" className="section-shell py-28 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)] lg:items-end">
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
            <span className="public-eyebrow">Booking</span>
            <h2 className="public-section-title mt-4 max-w-[12ch]">
              Book Your <span className="public-heading-gradient">Salon Experience</span>
            </h2>
            <p className="public-section-copy mt-5 max-w-2xl">
              Build the appointment that fits your look, choose your stylist, and confirm a time with live availability.
            </p>
          </motion.div>

          <motion.div className="public-panel flex flex-wrap items-center gap-3 p-5" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: 0.08 }}>
            <span className="public-chip">
              <ShieldCheck className="h-3.5 w-3.5 text-gold-primary" />
              Live availability
            </span>
            <span className="public-chip">
              <Sparkles className="h-3.5 w-3.5 text-gold-primary" />
              Tailored service mix
            </span>
            <span className="public-chip">
              <Mail className="h-3.5 w-3.5 text-gold-primary" />
              Instant confirmation
            </span>
          </motion.div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="public-panel p-5 md:p-7">
            <div className="grid gap-3 md:grid-cols-4">
              {steps.map((step, index) => {
                const StepIcon = getStepIcon(step.id)
                const active = currentStep === index
                const complete = isStepComplete(index)
                return (
                  <motion.button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (complete || index <= currentStep) setCurrentStep(index)
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      active ? 'border-gold-primary/45 bg-gold-primary/10' : 'border-gold-primary/15 bg-black/35 hover:border-gold-primary/30'
                    }`}
                    whileHover={{ y: -1 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
                        active || complete ? 'border-gold-primary/45 bg-gold-primary text-black' : 'border-gold-primary/20 bg-black/45 text-gold-primary'
                      }`}>
                        {complete && !active ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                      </span>
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500">Step {index + 1}</span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-400">{step.detail}</p>
                  </motion.button>
                )
              })}
            </div>

            <motion.div key={currentStep} className="mt-8" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
              {currentStep === 0 ? (
                <div>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Choose your services</h3>
                      <p className="mt-2 text-sm text-gray-400">Select one or more services to shape the appointment.</p>
                    </div>
                    {selectedPackageName ? <span className="public-chip !bg-gold-primary/10 !text-gold-primary">{selectedPackageName} package selected</span> : null}
                  </div>

                  {formData.stylist && !selectedPackageName ? (
                    <div className="mb-5 rounded-2xl border border-gold-primary/20 bg-gold-primary/10 px-4 py-3 text-sm text-gray-300">
                      Stylist preselected: <span className="font-semibold text-white">{formData.stylist}</span>
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {services.map((service) => {
                      const active = selectedServices.some((entry) => entry.id === service.id)
                      const ServiceIcon = getServiceIcon(service.name, service.icon, service.category)
                      return (
                        <motion.button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service)}
                          className={`rounded-2xl border p-5 text-left transition-colors ${
                            active ? 'border-gold-primary/45 bg-gold-primary/10' : 'border-gold-primary/15 bg-black/40 hover:border-gold-primary/30'
                          }`}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.995 }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="public-icon-wrap">
                              <ServiceIcon className="h-5 w-5" />
                            </span>
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                              active ? 'border-gold-primary bg-gold-primary text-black' : 'border-gold-primary/20 text-transparent'
                            }`}>
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          </div>
                          <h4 className="mt-5 text-lg font-semibold text-white">{service.name}</h4>
                          <p className="mt-2 text-sm text-gray-400">{service.category}</p>
                          <div className="mt-5 flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-gold-primary">LKR {service.price.toLocaleString()}</span>
                            {service.popular ? <span className="public-chip !text-[0.56rem]">Popular</span> : null}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-white">Select your stylist</h3>
                    <p className="mt-2 text-sm text-gray-400">Choose the stylist whose approach best suits the look you want.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {team.map((member) => {
                      const active = formData.stylist === member.name
                      return (
                        <motion.button
                          key={member.id}
                          type="button"
                          onClick={() => setValue('stylist', member.name)}
                          className={`rounded-2xl border p-5 text-left transition-colors ${
                            active ? 'border-gold-primary/45 bg-gold-primary/10' : 'border-gold-primary/15 bg-black/40 hover:border-gold-primary/30'
                          }`}
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-semibold text-white">{member.name}</h4>
                              <p className="mt-1 text-sm text-gold-primary">{member.role}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-white/80">
                              <Sparkles className="h-3.5 w-3.5 text-gold-primary" />
                              {member.rating ?? '4.9'}
                            </span>
                          </div>
                          <p className="mt-4 text-sm leading-6 text-gray-400">{member.bio || 'Consultation-led styling with a premium finish.'}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {member.specialties.slice(0, 3).map((specialty) => (
                              <span key={specialty} className="public-chip !text-[0.56rem]">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">Pick a date</h3>
                    <p className="mt-2 text-sm text-gray-400">Appointments open for the next two weeks.</p>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {dates.map((date) => {
                        const value = formatDateForValue(date)
                        const active = formData.date === value
                        return (
                          <motion.button
                            key={value}
                            type="button"
                            onClick={() => setValue('date', value)}
                            className={`rounded-2xl border p-4 text-left transition-colors ${
                              active ? 'border-gold-primary/45 bg-gold-primary text-black' : 'border-gold-primary/15 bg-black/40 text-white hover:border-gold-primary/30'
                            }`}
                            whileHover={{ y: -1 }}
                          >
                            <div className="text-[0.68rem] uppercase tracking-[0.18em] opacity-70">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="mt-3 text-2xl font-semibold">{date.getDate()}</div>
                            <div className="mt-1 text-sm opacity-75">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-semibold text-white">Choose a time</h3>
                        <p className="mt-2 text-sm text-gray-400">{formData.date ? formatLongDate(formData.date) : 'Select a date first to view availability.'}</p>
                      </div>
                      {isLoadingAvailability ? <Loader2 className="h-5 w-5 animate-spin text-gold-primary" /> : null}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {timeSlots.map((time) => {
                        const booked = bookedSlots.includes(time)
                        const active = formData.time === time
                        return (
                          <motion.button
                            key={time}
                            type="button"
                            onClick={() => {
                              if (!booked) setValue('time', time)
                            }}
                            disabled={booked}
                            className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                              active
                                ? 'border-gold-primary/45 bg-gold-primary text-black'
                                : booked
                                ? 'cursor-not-allowed border-white/8 bg-white/5 text-gray-600 line-through opacity-60'
                                : 'border-gold-primary/15 bg-black/40 text-white hover:border-gold-primary/30'
                            }`}
                            whileHover={!booked ? { y: -1 } : {}}
                          >
                            {time}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.78fr)]">
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">Full Name</label>
                      <input {...register('name')} type="text" placeholder="John Doe" className="w-full rounded-2xl border border-gold-primary/20 bg-black/45 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-primary/40" />
                      {errors.name ? <p className="mt-1 text-xs text-red-400">{errors.name.message}</p> : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">Email Address</label>
                      <input {...register('email')} type="email" placeholder="john@example.com" className="w-full rounded-2xl border border-gold-primary/20 bg-black/45 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-primary/40" />
                      {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email.message}</p> : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">Phone Number</label>
                      <input {...register('phone')} type="tel" placeholder="+94 (31) 223-4567" className="w-full rounded-2xl border border-gold-primary/20 bg-black/45 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-primary/40" />
                      {errors.phone ? <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p> : null}
                    </div>

                    {(errors.name || errors.email || errors.phone) ? (
                      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
                        Please complete all fields before confirming your appointment.
                      </div>
                    ) : null}

                    {errorMessage ? (
                      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{errorMessage}</div>
                    ) : null}

                    <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-primary px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#e4c455] disabled:cursor-not-allowed disabled:opacity-60">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                  </div>

                  <div className="public-card h-fit p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-gold-primary">Ready to confirm</p>
                    <h4 className="mt-3 text-xl font-semibold text-white">Final appointment overview</h4>
                    <div className="mt-5 space-y-4 text-sm text-gray-300">
                      <div className="flex items-start gap-3">
                        <UserRound className="mt-0.5 h-4 w-4 text-gold-primary" />
                        <div>
                          <p className="text-gray-500">Stylist</p>
                          <p className="mt-1 text-white">{formData.stylist || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-gold-primary" />
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="mt-1 text-white">{formData.date ? formatLongDate(formData.date) : '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 h-4 w-4 text-gold-primary" />
                        <div>
                          <p className="text-gray-500">Time</p>
                          <p className="mt-1 text-white">{formData.time || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 text-gold-primary" />
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p className="mt-1 text-white">{formData.phone || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : null}
            </motion.div>

            <div className="mt-8 flex flex-col gap-4 border-t border-gold-primary/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                  currentStep === 0 ? 'cursor-not-allowed border border-gold-primary/12 text-gray-600' : 'border border-gold-primary/24 text-gold-primary hover:bg-gold-primary/10'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canMoveNext}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                    canMoveNext ? 'bg-gold-primary text-black hover:bg-[#e4c455]' : 'cursor-not-allowed border border-gold-primary/12 text-gray-600'
                  }`}
                >
                  {currentStep === 2 ? 'Continue to Details' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="public-panel p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-gold-primary">Appointment summary</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Your selected experience</h3>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-white">Services</span>
                    <span className="text-sm font-semibold text-gold-primary">{formData.services?.length || 0} selected</span>
                  </div>
                  <div className="space-y-2">
                    {formData.services?.length ? (
                      formData.services.map((service) => (
                        <div key={service.id} className="rounded-xl border border-gold-primary/12 bg-black/35 px-4 py-3">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-gray-200">{service.name}</span>
                            <span className="text-gold-primary">LKR {service.price.toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-gold-primary/16 px-4 py-4 text-sm text-gray-500">No services selected yet.</div>
                    )}
                  </div>
                </div>

                <div className="public-divider" />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Stylist</span>
                    <span className="text-white">{formData.stylist || 'To be selected'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Date</span>
                    <span className="text-white">{formData.date ? formatDateForDisplay(new Date(`${formData.date}T00:00:00`)) : 'Pending'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Time</span>
                    <span className="text-white">{formData.time || 'Pending'}</span>
                  </div>
                </div>

                <div className="public-divider" />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm uppercase tracking-[0.18em] text-gray-500">Estimated total</span>
                  <span className="text-2xl font-semibold text-gold-primary">LKR {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="public-card p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold-primary">What to expect</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-300">
                <li className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 text-gold-primary" />
                  Live availability updates when you pick a stylist and date.
                </li>
                <li className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 text-gold-primary" />
                  Confirmation sent instantly to your email once the booking is complete.
                </li>
                <li className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 text-gold-primary" />
                  Packages selected from pricing are carried into the flow automatically.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
