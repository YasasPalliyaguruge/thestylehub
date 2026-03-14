'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock3, Mail, MapPin, Phone } from 'lucide-react'
import { FadeIn, SectionWrapper, SlideInLeft, SlideInRight } from '@/components/ui/SectionWrapper'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

const inputClass =
  'w-full min-h-[44px] rounded-xl border border-gold-primary/20 bg-black-primary/70 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-primary/55'

function InfoCard({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: typeof MapPin }) {
  return (
    <article className="public-card public-lead-card flex h-full flex-col p-[var(--card-pad)]">
      <span className="public-icon-wrap mb-3">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <div className="flex-1 text-sm leading-7 text-gray-300">{children}</div>
    </article>
  )
}

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          message: data.message,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message')
      }

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        reset()
      }, 4500)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SectionWrapper id="contact" className="section-shell py-10 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          className="mb-6 text-center sm:mb-8"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <span className="public-eyebrow">Contact</span>
          <h2 className="public-section-title mt-4">
            Let&apos;s Plan Your <span className="public-heading-gradient">Next Visit</span>
          </h2>
          <p className="public-section-copy mx-auto mt-4">
            Questions, consultations, or private bookings. We are here to guide you toward the right service and the right stylist.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
          <SlideInLeft className="grid gap-4 sm:grid-cols-2">
            <InfoCard title="Visit Us" icon={MapPin}>
              No. 123, Main Street
              <br />
              Negombo 11500, Sri Lanka
            </InfoCard>

            <InfoCard title="Opening Hours" icon={Clock3}>
              <div className="space-y-1.5">
                <div className="flex justify-between gap-3">
                  <span>Monday - Friday</span>
                  <span className="text-white">9:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Saturday</span>
                  <span className="text-white">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Sunday</span>
                  <span className="text-white">10:00 AM - 5:00 PM</span>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Contact Details" icon={Phone}>
              <div className="space-y-2">
                <a href="tel:+94312234567" className="inline-flex min-h-[44px] items-center gap-2 transition-colors hover:text-gold-primary">
                  <Phone className="h-4 w-4 text-gold-primary" />
                  +94 (31) 223-4567
                </a>
                <a
                  href="mailto:thestylehub.negombo@gmail.com"
                  className="inline-flex min-h-[44px] items-center gap-2 transition-colors hover:text-gold-primary"
                >
                  <Mail className="h-4 w-4 text-gold-primary" />
                  thestylehub.negombo@gmail.com
                </a>
              </div>
            </InfoCard>

            <article className="public-panel flex h-full flex-col p-[var(--card-pad)] sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.22em] text-gold-primary">Private Consultations</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Need guidance before you book?</h3>
              <p className="mt-3 text-sm leading-7 text-gray-300">
                Share your hair goals, preferred maintenance level, and ideal timing. We will help you choose the right appointment flow before you arrive.
              </p>
            </article>
          </SlideInLeft>

          <SlideInRight>
            {isSuccess ? (
              <motion.div className="public-card p-[var(--card-pad)] text-center sm:p-[calc(var(--card-pad)+0.5rem)]" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold-primary text-black">
                  <Mail className="h-6 w-6" />
                </span>
                <h3 className="text-2xl font-semibold text-white">Message Sent</h3>
                <p className="mt-2 text-gray-300">Thanks for reaching out. We will reply shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="public-panel space-y-3 p-[var(--card-pad)] sm:p-[calc(var(--card-pad)+0.5rem)]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Name</label>
                  <input {...register('name')} type="text" className={inputClass} />
                  {errors.name ? <p className="mt-1 text-xs text-red-400">{errors.name.message}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Email</label>
                  <input {...register('email')} type="email" className={inputClass} />
                  {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email.message}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Phone (Optional)</label>
                  <input {...register('phone')} type="tel" className={inputClass} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Message</label>
                  <textarea {...register('message')} rows={5} className={`${inputClass} resize-none`} placeholder="How can we help?" />
                  {errors.message ? <p className="mt-1 text-xs text-red-400">{errors.message.message}</p> : null}
                </div>

                {errorMessage ? (
                  <div className="rounded-lg border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-300">{errorMessage}</div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] rounded-xl bg-gold-primary px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </SlideInRight>
        </div>

        <FadeIn className="mt-6 overflow-hidden rounded-2xl border border-gold-primary/20 sm:mt-8">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63366.47843327788!2d79.81961475!3d7.2086956!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2a6c1c531a085%3A0x6b2f0f0f0f0f0f0!2sNegombo%2C%20Sri%20Lanka!5e0!3m2!1sen!2s!4v1705543200000!5m2!1sen!2s"
            width="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[280px] w-full grayscale transition-all duration-500 hover:grayscale-0 sm:h-[320px] lg:h-[360px]"
          />
        </FadeIn>
      </div>
    </SectionWrapper>
  )
}
