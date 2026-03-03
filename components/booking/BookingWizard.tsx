'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { getServiceIcon, getStepIcon, type StepIconKey } from '@/lib/icon-map'

// Service item type
interface ServiceItem {
  id: string
  name: string
  price: number
  icon: string | null
  popular?: boolean
  category: string
  active: boolean
}

// Team member type
interface TeamMember {
  id: string
  name: string
  role: string
  specialties: string[]
  image: string
  bio: string | null
  experience: number | null
  rating: number | null
  clients: number | null
  active: boolean
}

const bookingSchema = z.object({
  services: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number()
  })).min(1, 'Please select at least one service'),
  stylist: z.string().min(1, 'Please select a stylist'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(7, 'Please enter a valid phone number').max(20, 'Phone number is too long'),
})

type BookingFormData = z.infer<typeof bookingSchema>

const steps: Array<{ id: StepIconKey; title: string }> = [
  { id: 'service', title: 'Select Service' },
  { id: 'stylist', title: 'Choose Stylist' },
  { id: 'datetime', title: 'Pick Date & Time' },
  { id: 'contact', title: 'Your Details' },
]

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
]

// Generate next 14 days
const dates = Array.from({ length: 14 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() + i + 1)
  return date
})

// Format date for display
const formatDateForDisplay = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// Format date for form value
const formatDateForValue = (date: Date) => {
  return date.toISOString().split('T')[0]
}

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [selectedPackageName, setSelectedPackageName] = useState<string | null>(null)
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
    defaultValues: {
      services: [],
      stylist: '',
      date: '',
      time: '',
      name: '',
      email: '',
      phone: '',
    },
  })

  // Fetch services and team data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, teamRes] = await Promise.all([
          fetch('/api/public/services'),
          fetch('/api/public/team')
        ])

        const servicesData = await servicesRes.json()
        const teamData = await teamRes.json()

        if (servicesData.success) {
          // Ensure prices are numbers
          const parsedServices = servicesData.data.map((s: any) => ({
            ...s,
            price: typeof s.price === 'string' ? parseFloat(s.price) : (s.price || 0)
          }))
          setServices(parsedServices)
        } else {
          setDataError('Failed to load services')
        }

        if (teamData.success) {
          setTeam(teamData.data)
        } else {
          setDataError('Failed to load team members')
        }
      } catch (err) {
        setDataError('Failed to load data. Please refresh the page.')
        console.error('Error fetching data:', err)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  // Watch all form values for summary display
  const formData = watch()

  // Check for preselected stylist from sessionStorage (set by Team "Book with" button)
  // Also listen for custom event
  useEffect(() => {
    const applyPreselectedStylist = (stylistName: string) => {
      const stylistExists = team.some(member => member.name === stylistName)
      if (stylistExists) {
        setValue('stylist', stylistName)
        setCurrentStep(0) // Stay on services selection
      }
    }

    // Check sessionStorage on mount
    const preselectedStylist = sessionStorage.getItem('preselectedStylist')
    if (preselectedStylist) {
      applyPreselectedStylist(preselectedStylist)
      sessionStorage.removeItem('preselectedStylist')
    }

    // Listen for custom event
    const handlePreselectEvent = (event: any) => {
      applyPreselectedStylist(event.detail.stylist)
    }

    window.addEventListener('preselectStylist', handlePreselectEvent)

    return () => {
      window.removeEventListener('preselectStylist', handlePreselectEvent)
    }
  }, [setValue, team])

  // Check for preselected services from pricing plan
  useEffect(() => {
    const applyPreselectedServices = (serviceNames: string[], packageName?: string, gender?: 'men' | 'women') => {
      // Update package name
      if (packageName) {
        setSelectedPackageName(packageName)
      }

      // Create comprehensive service mappings
      const matchedServices: ServiceItem[] = []

      // Define service mappings based on pricing plan service names
      const serviceMappings: Record<string, (gender: 'men' | 'women') => ServiceItem | null> = {
        // Haircuts - gender specific
        'Haircut': (g) => services.find(s => {
          const name = s.name.toLowerCase()
          if (g === 'men') return name.includes('gent') && name.includes('haircut')
          return name.includes('lady') && name.includes('haircut')
        }) || null,
        'Precision Cut': (g) => services.find(s => {
          const name = s.name.toLowerCase()
          return name.includes('haircut')
        }) || null,

        // Beard services (men only)
        'Beard Trim': () => services.find(s => s.name === 'Beard Trimming') || null,
        'Beard Trimming': () => services.find(s => s.name === 'Beard Trimming') || null,
        'Beard Design': () => services.find(s => s.category === 'beard') || null,
        'Beard Sculpting': () => services.find(s => s.category === 'beard') || null,

        // Hair styling
        'Styling': (g) => services.find(s => {
          const name = s.name.toLowerCase()
          return name.includes('setting')
        }) || null,
        'Style': (g) => services.find(s => {
          const name = s.name.toLowerCase()
          return name.includes('setting')
        }) || null,
        'Wash & Style': (g) => services.find(s => {
          const name = s.name.toLowerCase()
          return name.includes('setting')
        }) || null,
        'Blow Dry': (g) => services.find(s => {
          const name = s.name.toLowerCase()
          return name.includes('setting')
        }) || null,
        'Blow Out': (g) => services.find(s => {
          const name = s.name.toLowerCase()
          return name.includes('setting')
        }) || null,

        // Treatments
        'Basic Treatment': () => services.find(s => s.category === 'treatment') || null,
        'Deep Conditioning': () => services.find(s => s.category === 'treatment') || null,
        'Hair Treatment': () => services.find(s => s.category === 'treatment') || null,
        'Scalp Treatment': () => services.find(s => s.category === 'treatment') || null,
        'Scalp Massage': () => services.find(s => s.category === 'treatment' || s.name.toLowerCase().includes('treatment')) || null,
        'Head Massage': () => services.find(s => s.name.toLowerCase().includes('perm')) || null,

        // Color services
        'Hair Coloring': (g) => services.find(s => s.category === 'color') || null,

        // Special: Hot Towel - included with beard shave
        'Hot Towel': () => services.find(s => s.name === 'Beard Shaving') || null,
        'Hot Towel Finish': () => services.find(s => s.name === 'Beard Shaving') || null,

        // Perming
        'Hair Perm': () => services.find(s => s.name.toLowerCase().includes('perm')) || null,
      }

      serviceNames.forEach(planService => {
        // Skip if already matched
        if (matchedServices.length > 0) {
          // Check if we already have this type of service
        }

        // Try exact mapping first
        const mappingFn = serviceMappings[planService]
        if (mappingFn) {
          const service = mappingFn(gender || 'men')
          if (service && !matchedServices.find(ms => ms.id === service.id)) {
            matchedServices.push(service)
            return
          }
        }

        // Fallback: partial match
        const planServiceLower = planService.toLowerCase()

        // Skip non-services
        if (planServiceLower === 'facial' || planServiceLower === 'refreshments') {
          return
        }

        // Try finding by partial name match
        const match = services.find(s => {
          const serviceName = s.name.toLowerCase()

          // Gender-aware matching
          if (gender === 'men') {
            if (planServiceLower.includes('haircut') || planServiceLower === 'precision cut') {
              return serviceName.includes('gent') && serviceName.includes('haircut')
            }
            if (planServiceLower.includes('styl') || planServiceLower.includes('blow') || planServiceLower.includes('wash')) {
              return serviceName.includes('setting') && serviceName.includes('gent')
            }
          } else {
            if (planServiceLower.includes('haircut') || planServiceLower === 'precision cut') {
              return serviceName.includes('lady') && serviceName.includes('haircut')
            }
            if (planServiceLower.includes('styl') || planServiceLower.includes('blow') || planServiceLower.includes('wash')) {
              return serviceName.includes('setting') && serviceName.includes('lady')
            }
          }

          // Category fallback
          if (planServiceLower.includes('beard')) {
            return s.category === 'beard'
          }
          if (planServiceLower.includes('treatment') || planServiceLower.includes('condition') || planServiceLower.includes('scalp')) {
            return s.category === 'treatment'
          }
          if (planServiceLower.includes('color') || planServiceLower.includes('dye') || planServiceLower.includes('highlight')) {
            return s.category === 'color'
          }

          // Last resort: contains
          return serviceName.includes(planServiceLower)
        })

        if (match && !matchedServices.find(ms => ms.id === match.id)) {
          matchedServices.push(match)
        }
      })

      // Always update - this allows switching packages
      setSelectedServices(matchedServices)
      setValue('services', matchedServices)
      setCurrentStep(0)
    }

    // Check sessionStorage on mount
    const preselectedServices = sessionStorage.getItem('preselectedServices')
    const preselectedPackage = sessionStorage.getItem('preselectedPackage')
    const preselectedGender = sessionStorage.getItem('preselectedGender') as 'men' | 'women' | null
    if (preselectedServices) {
      try {
        const serviceNames = JSON.parse(preselectedServices)
        applyPreselectedServices(serviceNames, preselectedPackage || undefined, preselectedGender || undefined)
      } catch (e) {
        console.error('Failed to parse preselected services:', e)
      }
    }

    // Listen for custom event - this is what gets triggered on each click
    const handlePreselectServicesEvent = (event: any) => {
      applyPreselectedServices(event.detail.services, event.detail.packageName, event.detail.gender)
    }

    window.addEventListener('preselectServices', handlePreselectServicesEvent)

    return () => {
      window.removeEventListener('preselectServices', handlePreselectServicesEvent)
    }
  }, [setValue, setSelectedServices, services])

  // Fetch availability when stylist and date are selected
  useEffect(() => {
    const fetchAvailability = async () => {
      if (formData.stylist && formData.date) {
        setIsLoadingAvailability(true)
        try {
          const response = await fetch(
            `/api/availability?stylist=${encodeURIComponent(formData.stylist)}&date=${formData.date}`
          )
          if (response.ok) {
            const data = await response.json()
            setBookedSlots(data.bookedSlots || [])

            // Clear time selection if it's now booked
            if (formData.time && data.bookedSlots?.includes(formData.time)) {
              setValue('time', '')
            }
          }
        } catch (error) {
          console.error('Failed to fetch availability:', error)
          setBookedSlots([])
        } finally {
          setIsLoadingAvailability(false)
        }
      } else {
        setBookedSlots([])
      }
    }

    fetchAvailability()
  }, [formData.stylist, formData.date, setValue])

  // Toggle service selection
  const toggleService = (service: ServiceItem) => {
    const isSelected = selectedServices.some(s => s.id === service.id)
    let newServices: ServiceItem[]

    if (isSelected) {
      newServices = selectedServices.filter(s => s.id !== service.id)
    } else {
      newServices = [...selectedServices, service]
    }

    setSelectedServices(newServices)
    setValue('services', newServices)
  }

  const onSubmit = async (data: BookingFormData) => {
    console.log('🔘 Form submit attempt')
    console.log('📝 Form data:', data)
    console.log('📝 Current errors:', errors)
    console.log('📝 Form valid:', !errors.name && !errors.email && !errors.phone && !errors.services)

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // Call the booking API
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: data.services,
          stylist: data.stylist,
          date: data.date,
          time: data.time,
          name: data.name,
          email: data.email,
          phone: data.phone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete booking')
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete booking')
      }

      setIsSuccess(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    // Validate current step before proceeding
    let canProceed = false

    switch (currentStep) {
      case 0:
        if (formData.services && formData.services.length > 0) canProceed = true
        break
      case 1:
        if (formData.stylist) canProceed = true
        break
      case 2:
        if (formData.date && formData.time) canProceed = true
        break
      case 3:
        // Form validation handled by handleSubmit
        break
    }

    if (canProceed && currentStep < steps.length - 1) {
      // If stylist is already pre-selected, skip step 1 (stylist selection)
      if (currentStep === 0 && formData.stylist) {
        setCurrentStep(2) // Skip to date/time selection
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleBookAnother = () => {
    setIsSuccess(false)
    setCurrentStep(0)
    setSelectedServices([])
    reset()
    setErrorMessage('')
  }

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return formData.services && formData.services.length > 0
      case 1:
        return !!formData.stylist
      case 2:
        return !!(formData.date && formData.time)
      case 3:
        return false // Contact step is the final step, not "complete" until submission
      default:
        return false
    }
  }

  // Allow going to next step with Enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && currentStep < 3) {
        e.preventDefault()
        nextStep()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentStep, formData])

  // Show loading state while fetching initial data
  if (isLoadingData) {
    return (
      <section id="booking" className="py-32 bg-gradient-dark">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-primary"></div>
          <p className="text-gray-400 mt-4">Loading booking data...</p>
        </div>
      </section>
    )
  }

  // Show error state if data fetch failed
  if (dataError) {
    return (
      <section id="booking" className="py-32 bg-gradient-dark">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-red-400">{dataError}</p>
          <p className="text-gray-500 mt-2">Please refresh the page to try again.</p>
        </div>
      </section>
    )
  }

  if (isSuccess) {
    return (
      <section id="booking" className="py-32 bg-gradient-dark">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-16"
          >
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-gold flex items-center justify-center">
              <svg className="w-12 h-12 text-black-primary" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Booking Confirmed!</h2>
            <p className="text-gray-400 text-lg mb-8">
              Thank you for booking with The Style Hub. We've sent a confirmation email to {formData.email}.
            </p>
            <div className="bg-gold-primary/5 border border-gold-primary/20 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
              <h4 className="text-white font-semibold mb-4">Booking Details</h4>
              <div className="space-y-3 text-gray-300">
                <div>
                  <p className="text-gray-500 mb-1">Services:</p>
                  <ul className="space-y-1">
                    {selectedServices.map((s, i) => (
                      <li key={i} className="flex justify-between text-white">
                        <span>{s.name}</span>
                        <span className="text-gold-primary">LKR {s.price.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gold-primary/20">
                    <span className="text-gold-primary">Total:</span>
                    <span className="text-gold-primary">LKR {selectedServices.reduce((sum, s) => sum + s.price, 0).toLocaleString()}</span>
                  </div>
                </div>
                <p><span className="text-gray-500">Stylist:</span> {formData.stylist}</p>
                <p><span className="text-gray-500">Date:</span> {formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '-'}</p>
                <p><span className="text-gray-500">Time:</span> {formData.time}</p>
              </div>
            </div>
            <button
              onClick={handleBookAnother}
              className="px-8 py-3 bg-gradient-gold text-black-primary font-semibold rounded-full hover:shadow-gold-glow transition-all"
            >
              Book Another Appointment
            </button>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <SectionWrapper id="booking" className="py-32 bg-gradient-dark">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.25, margin: '-30px' }}
        >
          <span className="text-gold-primary uppercase tracking-widest text-sm font-semibold">Book Now</span>
          <h2 className="font-display text-display-md md:text-display-lg mt-4 mb-6">
            Schedule Your <span className="text-gradient-gold">Experience</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Begin your journey to exceptional style
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-12 relative px-4">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gold-primary/20 -translate-y-1/2" />
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.25, margin: '-30px' }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                  index === currentStep
                    ? 'bg-gradient-gold text-black-primary ring-4 ring-gold-primary/30'
                    : isStepComplete(index)
                    ? 'bg-gold-primary text-black-primary'
                    : 'bg-black-medium border-2 border-gold-primary/30 text-gold-primary'
                }`}
              >
                {isStepComplete(index) && index !== currentStep ? (<Check className="w-5 h-5" />) : (() => { const StepIcon = getStepIcon(step.id); return <StepIcon className="w-5 h-5" /> })()}
              </div>
              <span className={`text-xs mt-2 ${
                index === currentStep
                  ? 'text-white font-semibold'
                  : isStepComplete(index)
                  ? 'text-gold-primary'
                  : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
            {/* Step 1: Select Service */}
            {currentStep === 0 && (
              <div>
                <h3 className="text-white text-xl font-semibold mb-2 text-center">Choose your services</h3>
                <p className="text-gray-400 text-sm text-center mb-6">Select one or more services</p>
                {/* Package indicator */}
                {selectedPackageName && (
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-primary/20 border border-gold-primary/40 rounded-full text-sm">
                      <span className="text-white font-bold">{selectedPackageName} Package</span>
                      <span className="text-white/90 font-semibold">selected</span>
                    </span>
                  </div>
                )}
                {formData.stylist && !selectedPackageName && (
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold-primary/10 border border-gold-primary/30 rounded-full text-sm">
                      <span className="text-gold-primary">Stylist:</span>
                      <span className="text-white font-semibold">{formData.stylist}</span>
                      <span className="text-gray-400">pre-selected</span>
                    </span>
                  </div>
                )}
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2 scroll-smooth"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {services.map((service) => {
                    const isSelected = selectedServices.some(s => s.id === service.id)
                    return (
                      <motion.button
                        key={`booking-${service.id}`}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`p-6 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-gold-primary bg-gold-primary/10 ring-2 ring-gold-primary/50'
                            : 'border-gold-primary/20 hover:border-gold-primary/50 bg-black-medium'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-gold-primary bg-gold-primary scale-110' : 'border-gold-primary/30 scale-100'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-black-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="mb-2">{(() => { const ServiceIcon = getServiceIcon(service.name, service.icon, service.category); return <ServiceIcon className="w-6 h-6 text-gold-primary" /> })()}</div>
                        <h3 className="text-white font-semibold mb-1 text-sm leading-tight">{service.name}</h3>
                        <p className="text-gold-primary text-sm font-semibold">LKR {service.price.toLocaleString()}</p>
                        {service.popular && (
                          <span className="inline-block mt-2 text-xs bg-gold-primary/20 text-gold-primary px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                {selectedServices.length > 0 && (
                  <div className="mt-4 p-4 bg-gold-primary/5 border border-gold-primary/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Selected: {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}</span>
                      <span className="text-gold-primary font-bold">
                        Total: LKR {selectedServices.reduce((sum, s) => sum + s.price, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Choose Stylist */}
            {currentStep === 1 && (
              <div>
                <h3 className="text-white text-xl font-semibold mb-6 text-center">Select your stylist</h3>
                <div className="grid grid-cols-2 gap-4">
                  {team.map((member) => (
                    <motion.button
                      key={`booking-${member.id}`}
                      type="button"
                      onClick={() => {
                        setValue('stylist', member.name)
                      }}
                      className={`p-6 rounded-xl border text-left transition-all ${
                        formData.stylist === member.name
                          ? 'border-gold-primary bg-gold-primary/10 ring-2 ring-gold-primary/50'
                          : 'border-gold-primary/20 hover:border-gold-primary/50 bg-black-medium'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <h3 className="text-white font-semibold mb-1">{member.name}</h3>
                      <p className="text-gold-primary text-sm">{member.role}</p>
                      <p className="text-gray-400 text-sm mt-2">{member.specialties.join(' | ')}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Pick Date & Time */}
            {currentStep === 2 && (
              <div>
                {/* Date Selection */}
                <h3 className="text-white text-xl font-semibold mb-4">Select Date</h3>
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {dates.map((date, index) => {
                    const dateValue = formatDateForValue(date)
                    const isSelected = formData.date === dateValue

                    return (
                      <motion.button
                        key={dateValue}
                        type="button"
                        onClick={() => {
                          setValue('date', dateValue)
                        }}
                        className={`p-2 rounded-lg text-center transition-all ${
                          isSelected
                            ? 'bg-gradient-gold text-black-primary'
                            : 'bg-black-medium border border-gold-primary/20 hover:border-gold-primary text-white'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-xs uppercase opacity-70">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-lg font-bold">{date.getDate()}</div>
                        <div className="text-xs opacity-70">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Time Selection */}
                <h3 className="text-white text-xl font-semibold mb-4">Select Time</h3>
                {isLoadingAvailability ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gold-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-400">Checking availability...</span>
                  </div>
                ) : (
                  <>
                    {bookedSlots.length > 0 && (
                      <p className="text-gray-400 text-sm mb-3">
                        {bookedSlots.length} slot{bookedSlots.length > 1 ? 's are' : ' is'} already booked
                      </p>
                    )}
                    <div className="grid grid-cols-6 gap-2">
                      {timeSlots.map((time) => {
                        const isBooked = bookedSlots.includes(time)
                        return (
                          <motion.button
                            key={time}
                            type="button"
                            onClick={() => {
                              if (!isBooked) {
                                setValue('time', time)
                              }
                            }}
                            disabled={isBooked}
                            className={`py-3 px-2 rounded-lg text-sm transition-all ${
                              formData.time === time
                                ? 'bg-gradient-gold text-black-primary'
                                : isBooked
                                ? 'bg-gray-800/50 border border-gray-700 text-gray-600 cursor-not-allowed line-through opacity-60'
                                : 'bg-black-medium border border-gold-primary/20 hover:border-gold-primary text-white'
                            }`}
                            whileHover={!isBooked ? { scale: 1.02 } : {}}
                            whileTap={!isBooked ? { scale: 0.98 } : {}}
                            title={isBooked ? 'This slot is already booked' : time}
                          >
                            {time}
                          </motion.button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Contact Details */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-testid="booking-form">
                <div>
                  <label className="block text-white font-semibold mb-2">Full Name</label>
                  <input
                    {...register('name')}
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg bg-black-medium border border-gold-primary/20 focus:border-gold-primary text-white placeholder-gray-500 outline-none transition-all"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Email Address</label>
                  <input
                    {...register('email')}
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-black-medium border border-gold-primary/20 focus:border-gold-primary text-white placeholder-gray-500 outline-none transition-all"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Phone Number</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    name="phone"
                    placeholder="+94 (31) 223-4567"
                    className="w-full px-4 py-3 rounded-lg bg-black-medium border border-gold-primary/20 focus:border-gold-primary text-white placeholder-gray-500 outline-none transition-all"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                {/* Booking Summary */}
                <div className="p-5 rounded-xl bg-gold-primary/5 border border-gold-primary/20">
                  <h4 className="text-white font-semibold mb-3">Booking Summary</h4>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Services:</span>
                      <ul className="text-white mt-1 space-y-1">
                        {formData.services && formData.services.length > 0 ? (
                          formData.services.map((s: any, i: number) => (
                            <li key={i} className="flex justify-between">
                              <span>{s.name}</span>
                              <span className="text-gold-primary">LKR {s.price.toLocaleString()}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500">No services selected</li>
                        )}
                      </ul>
                      {formData.services && formData.services.length > 0 && (
                        <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gold-primary/20">
                          <span className="text-gold-primary">Total:</span>
                          <span className="text-gold-primary">
                            LKR {formData.services.reduce((sum: number, s: any) => sum + s.price, 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-gray-500">Stylist:</span>
                        <p className="text-white">{formData.stylist || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <p className="text-white">{formData.time || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="text-white">{formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Validation Errors Summary - show before API errors */}
                {(errors.name || errors.email || errors.phone) && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                    <p className="text-yellow-400 text-center font-semibold mb-2">Please complete all fields:</p>
                    <ul className="text-yellow-400 text-sm space-y-1">
                      {errors.name && <li>- {errors.name.message}</li>}
                      {errors.email && <li>- {errors.email.message}</li>}
                      {errors.phone && <li>- {errors.phone.message}</li>}
                    </ul>
                  </div>
                )}

                {/* API Error Message */}
                {errorMessage && !errors.name && !errors.email && !errors.phone && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                    <p className="text-red-400 text-center">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    console.log('🔘 Button clicked, isSubmitting:', isSubmitting)
                    console.log('📝 Current form errors:', errors)
                  }}
                  className="w-full py-4 bg-gradient-gold text-black-primary font-semibold rounded-lg hover:shadow-gold-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </form>
            )}
          </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 0
                ? 'opacity-50 cursor-not-allowed border border-gold-primary/20 text-gray-500'
                : 'border border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-black-primary'
            }`}
          >
            Back
          </button>

          {/* Show Next button for steps 0-2, Confirm for step 3 is handled by form submit */}
          {currentStep < 3 && (
            <button
              onClick={nextStep}
              disabled={
                (currentStep === 0 && (!formData.services || formData.services.length === 0)) ||
                (currentStep === 1 && !formData.stylist) ||
                (currentStep === 2 && (!formData.date || !formData.time))
              }
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                ((currentStep === 0 && (!formData.services || formData.services.length === 0)) ||
                 (currentStep === 1 && !formData.stylist) ||
                 (currentStep === 2 && (!formData.date || !formData.time)))
                  ? 'opacity-50 cursor-not-allowed border border-gold-primary/20 text-gray-500'
                  : 'bg-gradient-gold text-black-primary hover:shadow-gold-glow'
              }`}
            >
              {currentStep === 2 ? 'Continue to Details' : 'Next'}
            </button>
          )}
        </div>

        {/* Selection hint */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          {currentStep === 0 && (!formData.services || formData.services.length === 0) && 'Select at least one service to continue'}
          {currentStep === 1 && !formData.stylist && 'Select a stylist to continue'}
          {currentStep === 2 && (!formData.date || !formData.time) && 'Select date and time to continue'}
        </div>
      </div>
    </SectionWrapper>
  )
}


