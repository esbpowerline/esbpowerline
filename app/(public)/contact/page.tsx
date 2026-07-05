'use client';

import { useEffect, useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle2 } from 'lucide-react';
import { ContactGeometryBackdrop } from '@/components/shared/ContactGeometryBackdrop';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/contact/csrf')
      .then((res) => res.json())
      .then((data: { token?: string }) => {
        if (!cancelled && data.token) setCsrfToken(data.token);
      })
      .catch(() => {
        /* same-origin fallback in checkCsrf */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    
    setLoading(true);
    setError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) headers['x-csrf-token'] = csrfToken;

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden isolate">
      {/* Background dot pattern texture with a fade mask */}
      <div 
        className="absolute inset-0 hero-dot-pattern opacity-60 pointer-events-none -z-20"
        style={{ 
          maskImage: 'radial-gradient(ellipse at top, black, transparent)', 
          WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent)' 
        }} 
      />
      
      {/* Background glow decoration */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/3 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Connection Network Constellation Geometry Backdrop with Parallax */}
      <ContactGeometryBackdrop />

      <div className="container container--shell py-12 md:py-16 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground font-light max-w-xl mx-auto">
              Have questions, feedback, or news tips? Get in touch with our editorial and advertising teams.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start pt-6">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <div id="advertising" className="card p-6 border border-border/40 bg-card/20 rounded-3xl space-y-6 scroll-mt-24">
                <h3 className="text-xl font-display font-bold">Office Information</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="p-3 h-fit rounded-xl bg-primary/10 text-primary shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">
                        Editorial & Office Address
                      </h5>
                      <p className="text-base text-foreground font-medium">ESB Media Limited</p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        House #36/1, Avenue #01, Block-A, Section-10, Mirpur, Pallabi, Dhaka-1216, Bangladesh.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-3 h-fit rounded-xl bg-primary/10 text-primary shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">
                        Email Address
                      </h5>
                       <a
                        href="mailto:esbplbd@gmail.com"
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        esbplbd@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-3 h-fit rounded-xl bg-primary/10 text-primary shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">
                        WhatsApp Preferable
                      </h5>
                      <a
                        href="https://wa.me/8801711378733"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors font-semibold"
                      >
                        +880 1711-378733
                      </a>
                      <a
                        href="tel:+8801711378733"
                        className="block text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
                      >
                        Direct Call
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="card p-6 md:p-8 border border-border/40 bg-card/25 rounded-3xl">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="inline-flex p-3 rounded-full bg-green-500/10 text-green-500 mb-2">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h3 className="text-2xl font-display font-bold">Message Sent!</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Thank you for reaching out. A member of our editorial or support team will get back to you shortly.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setName('');
                        setEmail('');
                        setPhone('');
                        setSubject('');
                        setMessage('');
                      }}
                      className="btn border border-border hover:bg-muted mt-4 text-sm"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h3 className="text-xl font-display font-bold">Send a Message</h3>
                    
                    {error && (
                      <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
                        {error}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-3.5 block">
                          Your Name <span className="text-primary">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-3.5 block">
                          Your Email <span className="text-primary">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-3.5 block">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                          placeholder="+880 1XXXXXXXXX"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-3.5 block">
                          Subject
                        </label>
                        <input
                          id="subject"
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                          placeholder="Advertising request, news tip..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-3.5 block">
                        Message <span className="text-primary">*</span>
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-foreground resize-none"
                        placeholder="Type your message here..."
                      />
                    </div>

                    <div className="relative group/btn pt-2">
                      {/* Glow background drop decoration */}
                      <div className="absolute inset-x-0 bottom-0 top-2 bg-gradient-to-r from-primary to-indigo-500 rounded-xl blur-lg opacity-35 group-hover/btn:opacity-60 transition duration-300 -z-10" />
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative overflow-hidden flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold transition-all text-white bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] hover:bg-[right_center] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 active:scale-[0.985] shadow-lg shadow-primary/25 cursor-pointer border-0"
                      >
                        {/* Shimmer sweep effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-[250%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                        
                        {loading ? (
                          'Sending...'
                        ) : (
                          <>
                            <Send className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
