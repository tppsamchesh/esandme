'use client'

import { useState, type FormEvent } from 'react'

const inputClass =
  'w-full rounded-lg border border-gray-200 px-4 py-3 text-brand-text placeholder:text-brand-text/40 focus:border-[#8BA888] focus:outline-none'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div>
      <section
        className="w-full bg-gradient-to-b from-brand-bg to-[#E8EFE7] px-4 py-16 text-center md:py-20"
        aria-labelledby="contact-heading"
      >
        <h1
          id="contact-heading"
          className="font-heading text-4xl font-medium tracking-tight text-brand-text md:text-5xl"
        >
          Get in touch
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-brand-text/75">
          We&apos;d love to hear from you. Drop us a message and we&apos;ll get
          back to you within 24 hours.
        </p>
      </section>

      <section className="mx-auto max-w-xl px-4 py-12 md:py-16">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          {submitted ? (
            <div className="text-center">
              <p className="font-heading text-2xl font-medium text-brand-text">
                Thank you
              </p>
              <p className="mt-3 text-sm leading-relaxed text-brand-text/70">
                We&apos;ve received your message and will reply within 24 hours.
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="contact-name" className="sr-only">
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="sr-only">
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message"
                  className={`${inputClass} resize-y min-h-[9rem]`}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#8BA888] py-3 text-sm font-medium text-white transition-colors hover:bg-[#8BA888]/90"
              >
                Send message
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-brand-text/55">
          Or email us directly at{' '}
          <a
            href="mailto:hello@esandme.com"
            className="text-brand-primary underline-offset-2 hover:underline"
          >
            hello@esandme.com
          </a>
        </p>
      </section>
    </div>
  )
}
