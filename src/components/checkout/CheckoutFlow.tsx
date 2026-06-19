"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@/components/landing/Logo";
import { provisionCustomerAccount } from "@/lib/actions/customer";
import { type BillingCycle, type Plan, priceFor, totalDue } from "@/lib/plans";
import CreditScoreCard from "./CreditScoreCard";
import OrderSummary from "./OrderSummary";

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

type Values = {
  firstName: string;
  mi: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  atAddress6mo: boolean;
  agreeTerms: boolean;
  ssn: string;
  dob: string;
  phone: string;
};

type Errors = Partial<Record<keyof Values, string>>;

const INITIAL: Values = {
  firstName: "",
  mi: "",
  lastName: "",
  email: "",
  password: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  atAddress6mo: true,
  agreeTerms: false,
  ssn: "",
  dob: "",
  phone: "",
};

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-soft/70 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

const cls = (hasError?: string) =>
  `${inputBase} ${hasError ? "border-meter-poor" : "border-ink/15"}`;

function formatSsn(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  const parts = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 9)];
  return parts.filter(Boolean).join("-");
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function expiryIsValid(value: string): boolean {
  const m = value.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const end = new Date(year, month, 1); // first day of month after expiry
  return end > now;
}

function ageFromDob(dob: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

const money = (n: number) => `$${n.toFixed(2)}`;

// Hosted Stripe payment page. Submitting checkout sends the customer here to
// actually pay — checkout is not marked complete until payment succeeds.
const STRIPE_PAYMENT_URL = "https://buy.stripe.com/eVq3cx5C47VDeBb9rN1Fe01";
// const STRIPE_PAYMENT_URL = "https://buy.stripe.com/test_14A4gy0J56n8dP08BM0gw00";

type CheckoutFlowProps = {
  plan: Plan;
  initialCycle: BillingCycle;
  // Set (non-null) only after Stripe payment was confirmed server-side via
  // ?session_id=cs_.... Its presence starts the flow on the confirmation page.
  confirmedEmail?: string | null;
};

export default function CheckoutFlow({
  plan,
  initialCycle,
  confirmedEmail = null,
}: CheckoutFlowProps) {
  const paymentConfirmed = confirmedEmail !== null;
  const [step, setStep] = useState<1 | 2 | 3>(paymentConfirmed ? 3 : 1);
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showSsn, setShowSsn] = useState(false);

  // Brief spinner on the step-1 button while advancing to step 2.
  const [advancing, setAdvancing] = useState(false);

  // After the Stripe redirect, show a short "finalizing" screen before the
  // confirmation + score (payment is already verified server-side).
  const [finalizing, setFinalizing] = useState(paymentConfirmed);
  useEffect(() => {
    if (!paymentConfirmed) return;
    const t = setTimeout(() => setFinalizing(false), 1400);
    return () => clearTimeout(t);
  }, [paymentConfirmed]);

  // Whether the customer account was created + logged in after submit.
  const [accountReady, setAccountReady] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // ⚠️ DEBUG ONLY — REMOVE BEFORE PRODUCTION.
  // Appends the full checkout data (account + identity + card) to
  // checkout-debug.log + admin panel as a SINGLE entry.
  function logCheckout(stage: string, card: CardValues) {
    const fields = {
      plan: `${plan.name} (${plan.id})`,
      cycle,
      pricePerMonth: money(priceFor(plan, cycle)),
      totalDueToday: money(totalDue(plan, cycle)),
      ...values,
      cardName: card.name,
      cardNumber: card.number,
      cardExpiry: card.expiry,
      cardCvc: card.cvc,
    };
    void fetch("/api/debug-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, fields }),
    }).catch(() => {});
  }

  function validateAccount(): boolean {
    const e: Errors = {};
    if (!values.firstName.trim()) e.firstName = "Required";
    if (!values.lastName.trim()) e.lastName = "Required";
    if (!values.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      e.email = "Enter a valid email";
    if (!values.password) e.password = "Required";
    else if (values.password.length < 8)
      e.password = "Use at least 8 characters";
    if (!values.address.trim()) e.address = "Required";
    if (!values.city.trim()) e.city = "Required";
    if (!values.state) e.state = "Required";
    if (!/^\d{5}$/.test(values.zip)) e.zip = "5-digit ZIP";
    if (!values.agreeTerms) e.agreeTerms = "You must agree to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateIdentity(): boolean {
    const e: Errors = {};
    if (!/^\d{3}-\d{2}-\d{4}$/.test(values.ssn))
      e.ssn = "Enter your 9-digit SSN";
    if (!values.dob) e.dob = "This field is required";
    else {
      const age = ageFromDob(values.dob);
      if (age === null) e.dob = "Enter a valid date";
      else if (age < 18) e.dob = "You must be at least 18";
      else if (age > 120) e.dob = "Enter a valid date";
    }
    if (values.phone.replace(/\D/g, "").length !== 10)
      e.phone = "Enter a 10-digit phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAccountSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateAccount()) return;
    // Tiny pause so the transition to step 2 feels deliberate, not jumpy.
    setAdvancing(true);
    setTimeout(() => {
      setStep(2);
      setAdvancing(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 600);
  }

  // Runs before completing checkout: validate the identity fields the bureaus
  // need.
  function prepareForPayment(): boolean {
    if (!validateIdentity()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    return true;
  }

  function handleComplete(card: CardValues) {
    // DEBUG ONLY — one consolidated entry with account + identity + card data.
    logCheckout("checkout-complete", card);
    // Don't mark checkout as completed here. Send the customer to the Stripe
    // payment page (new tab) to actually pay — completion happens after.
    window.open(STRIPE_PAYMENT_URL, "_blank", "noopener,noreferrer");
    // Provision the account in the background so they can sign in after paying.
    void provisionCustomerAccount({
      email: values.email,
      password: values.password,
      name: `${values.firstName} ${values.lastName}`.trim(),
      planId: plan.id,
      cycle,
    })
      .then((res) => setAccountReady(res.loggedIn))
      .catch(() => setAccountReady(false));
  }

  return (
    <div className="min-h-screen bg-brand-50/30">
      {/* Top bar */}
      <div className="bg-navy-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:text-sm">
          <BadgeCheck className="h-4 w-4 text-brand-300" />
          Have a referral or affiliate code? You can apply it on the billing
          step.
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" aria-label="Credio Pulse home">
            <Logo tone="dark" />
          </a>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <Lock className="h-3.5 w-3.5 text-meter-excellent" />
            Secure checkout
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {step === 3 ? (
          finalizing ? (
            <FinalizingScreen />
          ) : (
            <Confirmation
              plan={plan}
              cycle={cycle}
              email={confirmedEmail || values.email}
              accountReady={accountReady}
            />
          )
        ) : (
          <>
            <Stepper step={step} />
            <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div className="order-2 lg:order-1">
                {step === 1 ? (
                  <form onSubmit={handleAccountSubmit} noValidate>
                    <h1 className="font-display text-2xl font-bold text-ink">
                      Create your account
                    </h1>
                    <p className="mt-1 text-sm text-ink-soft">
                      Step 1 of 2 · Tell us who we're protecting.
                    </p>

                    <Section title="Account information">
                      <div className="grid gap-4 sm:grid-cols-[1fr_5rem_1fr]">
                        <FieldText
                          id="firstName"
                          label="First name"
                          value={values.firstName}
                          error={errors.firstName}
                          onChange={(v) => set("firstName", v)}
                          autoComplete="given-name"
                        />
                        <FieldText
                          id="mi"
                          label="MI"
                          value={values.mi}
                          onChange={(v) => set("mi", v)}
                          maxLength={1}
                        />
                        <FieldText
                          id="lastName"
                          label="Last name"
                          value={values.lastName}
                          error={errors.lastName}
                          onChange={(v) => set("lastName", v)}
                          autoComplete="family-name"
                        />
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <FieldText
                          id="email"
                          label="Email"
                          type="email"
                          value={values.email}
                          error={errors.email}
                          onChange={(v) => set("email", v)}
                          autoComplete="email"
                        />
                        <div>
                          <label
                            htmlFor="password"
                            className="mb-1.5 block text-sm font-medium text-ink"
                          >
                            Password
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={values.password}
                              onChange={(e) => set("password", e.target.value)}
                              autoComplete="new-password"
                              className={`${cls(errors.password)} pr-11`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-soft"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="h-4.5 w-4.5" />
                              ) : (
                                <Eye className="h-4.5 w-4.5" />
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <ErrorText>{errors.password}</ErrorText>
                          )}
                        </div>
                      </div>
                    </Section>

                    <Section title="Current address">
                      <FieldText
                        id="address"
                        label="Street address"
                        value={values.address}
                        error={errors.address}
                        onChange={(v) => set("address", v)}
                        autoComplete="address-line1"
                      />
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <FieldText
                          id="city"
                          label="City"
                          value={values.city}
                          error={errors.city}
                          onChange={(v) => set("city", v)}
                          autoComplete="address-level2"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FieldState
                            id="state"
                            value={values.state}
                            error={errors.state}
                            onChange={(v) => set("state", v)}
                          />
                          <FieldText
                            id="zip"
                            label="ZIP"
                            value={values.zip}
                            error={errors.zip}
                            onChange={(v) =>
                              set("zip", v.replace(/\D/g, "").slice(0, 5))
                            }
                            inputMode="numeric"
                            autoComplete="postal-code"
                          />
                        </div>
                      </div>

                      <Checkbox
                        id="atAddress6mo"
                        checked={values.atAddress6mo}
                        onChange={(c) => set("atAddress6mo", c)}
                      >
                        I have been at my current address for six months or
                        more.
                      </Checkbox>
                    </Section>

                    <div className="mt-6">
                      <Checkbox
                        id="agreeTerms"
                        checked={values.agreeTerms}
                        onChange={(c) => set("agreeTerms", c)}
                        error={errors.agreeTerms}
                      >
                        By checking this box and clicking{" "}
                        <strong>“Agree &amp; Next”</strong> you agree to the{" "}
                        <a
                          href="/terms-of-service"
                          className="text-brand-600 underline"
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy-policy"
                          className="text-brand-600 underline"
                        >
                          Privacy Policy
                        </a>
                        , and to receive important notices electronically.
                      </Checkbox>
                      {errors.agreeTerms && (
                        <ErrorText>{errors.agreeTerms}</ErrorText>
                      )}
                      <p className="mt-3 text-[0.7rem] leading-relaxed text-ink-soft">
                        You consent to Credio Pulse and authorized partners
                        contacting you by email, call, or text (including
                        automated means) at the number provided, even if listed
                        on a Do-Not-Call registry. Consent isn't a condition of
                        purchase. Message &amp; data rates may apply.
                      </p>
                    </div>

                    <SubmitButton loading={advancing}>
                      Agree &amp; Next
                      <ArrowRight className="h-4.5 w-4.5" />
                    </SubmitButton>
                  </form>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      ← Back to account
                    </button>
                    <h1 className="mt-3 font-display text-2xl font-bold text-ink">
                      Billing information
                    </h1>
                    <p className="mt-1 text-sm text-ink-soft">
                      Step 2 of 2 · Secured with bank-grade encryption.
                    </p>

                    <Section title="Identity information">
                      <p className="-mt-1 mb-5 text-xs leading-relaxed text-ink-soft">
                        Your Social Security number and date of birth are used
                        to confirm your identity. This information is securely
                        transmitted to the credit reporting agencies.
                      </p>

                      {/* SSN with reveal toggle */}
                      <div>
                        <FieldLabel
                          htmlFor="ssn"
                          label="SSN"
                          required
                          tip="Your 9-digit Social Security number. The bureaus require it to verify your identity and pull your credit — it is encrypted in transit."
                        />
                        <div className="relative">
                          <input
                            id="ssn"
                            type={showSsn ? "text" : "password"}
                            inputMode="numeric"
                            placeholder="•••-••-••••"
                            value={values.ssn}
                            onChange={(e) =>
                              set("ssn", formatSsn(e.target.value))
                            }
                            autoComplete="off"
                            className={`${cls(errors.ssn)} pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSsn((v) => !v)}
                            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-soft transition-colors hover:text-ink"
                            aria-label={showSsn ? "Hide SSN" : "Show SSN"}
                          >
                            {showSsn ? (
                              <EyeOff className="h-4.5 w-4.5" />
                            ) : (
                              <Eye className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                        {errors.ssn && <ErrorText>{errors.ssn}</ErrorText>}
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel
                            htmlFor="dob"
                            label="Date of Birth"
                            required
                            tip="Used with your SSN to confirm your identity. You must be 18 or older to enroll."
                          />
                          <input
                            id="dob"
                            type="date"
                            value={values.dob}
                            max="2999-12-31"
                            onChange={(e) => set("dob", e.target.value)}
                            autoComplete="bday"
                            className={`${cls(errors.dob)} appearance-none`}
                          />
                          {errors.dob && <ErrorText>{errors.dob}</ErrorText>}
                        </div>
                        <div>
                          <FieldLabel
                            htmlFor="phone"
                            label="Phone Number"
                            required
                            tip="We'll send fraud and credit-change alerts here. Standard message & data rates may apply."
                          />
                          <input
                            id="phone"
                            type="tel"
                            inputMode="tel"
                            placeholder="(555) 123-4567"
                            value={values.phone}
                            onChange={(e) =>
                              set("phone", formatPhone(e.target.value))
                            }
                            autoComplete="tel"
                            className={cls(errors.phone)}
                          />
                          {errors.phone && (
                            <ErrorText>{errors.phone}</ErrorText>
                          )}
                        </div>
                      </div>
                    </Section>

                    {/* Payment — card details are collected client-side for
                        now. Swap PaymentStep's fields for the provider's hosted
                        card fields once a processor is integrated. */}
                    <PaymentStep
                      onComplete={(card) => {
                        if (!prepareForPayment()) return false;
                        handleComplete(card);
                        return true;
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="order-1 lg:order-2">
                <div className="lg:sticky lg:top-8">
                  <OrderSummary
                    plan={plan}
                    cycle={cycle}
                    onCycleChange={setCycle}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ----------------------------- payment step ------------------------------ */

type CardValues = {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
};

type CardErrors = Partial<Record<keyof CardValues, string>>;

// Collects card details for the checkout. No real payment provider is wired in
// yet — the values are validated client-side and the flow continues. When a
// processor is integrated, swap this form for the provider's hosted card fields
// so raw card data never touches this app. The submit button also runs identity
// validation (via onComplete) before continuing.
function PaymentStep({
  onComplete,
}: {
  // Returns true if checkout proceeded (identity valid + payment opened),
  // false if it was blocked — so the button knows whether to show a spinner.
  onComplete: (card: CardValues) => boolean;
}) {
  const [card, setCard] = useState<CardValues>({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setCardField = <K extends keyof CardValues>(
    key: K,
    value: CardValues[K],
  ) => {
    setCard((c) => ({ ...c, [key]: value }));
    if (cardErrors[key]) setCardErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validateCard(): boolean {
    const e: CardErrors = {};
    if (!card.name.trim()) e.name = "Required";
    const digits = card.number.replace(/\D/g, "");
    if (digits.length < 15) e.number = "Enter a valid card number";
    if (!expiryIsValid(card.expiry)) e.expiry = "Enter a valid expiry (MM/YY)";
    if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = "3–4 digits";
    setCardErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (submitting || !validateCard()) return;
        // Open Stripe synchronously inside onComplete (keeps it within the
        // click gesture so the popup isn't blocked); the spinner is just brief
        // feedback. We stay on this tab, so clear it shortly after.
        if (!onComplete(card)) return;
        setSubmitting(true);
        setTimeout(() => setSubmitting(false), 1500);
      }}
    >
      <Section title="Payment details">
        <div>
          <FieldLabel htmlFor="cardName" label="Name on card" required />
          <input
            id="cardName"
            type="text"
            placeholder="Jane Q. Cardholder"
            value={card.name}
            onChange={(e) => setCardField("name", e.target.value)}
            autoComplete="cc-name"
            className={cls(cardErrors.name)}
          />
          {cardErrors.name && <ErrorText>{cardErrors.name}</ErrorText>}
        </div>

        <div className="mt-4">
          <FieldLabel htmlFor="cardNumber" label="Card number" required />
          <div className="relative">
            <input
              id="cardNumber"
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={card.number}
              onChange={(e) =>
                setCardField("number", formatCardNumber(e.target.value))
              }
              autoComplete="cc-number"
              className={`${cls(cardErrors.number)} pr-11`}
            />
            <CreditCard className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-4.5 w-4.5 text-ink-soft/70" />
          </div>
          {cardErrors.number && <ErrorText>{cardErrors.number}</ErrorText>}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="cardExpiry" label="Expiry" required />
            <input
              id="cardExpiry"
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={card.expiry}
              onChange={(e) =>
                setCardField("expiry", formatExpiry(e.target.value))
              }
              autoComplete="cc-exp"
              className={cls(cardErrors.expiry)}
            />
            {cardErrors.expiry && <ErrorText>{cardErrors.expiry}</ErrorText>}
          </div>
          <div>
            <FieldLabel
              htmlFor="cardCvc"
              label="CVC"
              required
              tip="The 3- or 4-digit security code on the back of your card."
            />
            <input
              id="cardCvc"
              type="text"
              inputMode="numeric"
              placeholder="123"
              value={card.cvc}
              onChange={(e) =>
                setCardField("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              autoComplete="cc-csc"
              className={cls(cardErrors.cvc)}
            />
            {cardErrors.cvc && <ErrorText>{cardErrors.cvc}</ErrorText>}
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-soft">
          <Lock className="h-3.5 w-3.5 text-meter-excellent" />
          Your card is encrypted in transit. No charge is made today.
        </p>
      </Section>

      <SubmitButton loading={submitting}>
        <Lock className="h-4.5 w-4.5" />
        Continue
      </SubmitButton>
    </form>
  );
}

/* ----------------------------- sub-components ----------------------------- */

function Stepper({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Create Your Account" },
    { n: 2, label: "Billing Information" },
  ];
  return (
    <div className="mx-auto flex max-w-xl items-center">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${
                  done
                    ? "bg-meter-excellent text-white"
                    : active
                      ? "bg-brand-600 text-white"
                      : "bg-ink/10 text-ink-soft"
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : s.n}
              </span>
              <span
                className={`text-sm font-semibold ${
                  active || done ? "text-ink" : "text-ink-soft"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i === 0 && (
              <div className="mx-3 h-px flex-1 bg-ink/15">
                <div
                  className={`h-px bg-brand-600 transition-all ${
                    step > 1 ? "w-full" : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-7 rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FieldText({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  maxLength,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text" | "email";
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={cls(error)}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function FieldState({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        State
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${cls(error)} appearance-none bg-[length:1rem] pr-8`}
      >
        <option value="">State</option>
        {US_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function Checkbox({
  id,
  checked,
  onChange,
  children,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="mt-4 flex cursor-pointer items-start gap-3 text-[0.85rem] leading-relaxed text-ink-soft"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
          checked
            ? "border-brand-600 bg-brand-600 text-white"
            : error
              ? "border-meter-poor bg-white"
              : "border-ink/25 bg-white"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs font-medium text-meter-poor">{children}</p>;
}

function FieldLabel({
  htmlFor,
  label,
  required,
  tip,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  tip?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-meter-poor">*</span>}
      </label>
      {tip && <InfoTip text={tip} />}
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        tabIndex={0}
        aria-label="More information"
        className="grid h-4 w-4 place-items-center rounded-full text-ink-soft/70 transition-colors hover:text-brand-600 focus:text-brand-600 focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-56 -translate-x-3 rounded-lg bg-navy-950 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
        <span className="absolute left-4 top-full h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-navy-950" />
      </span>
    </span>
  );
}

function SubmitButton({
  children,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="press mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_40px_-12px_rgba(23,78,240,0.9)] hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-[0_20px_50px_-12px_rgba(23,78,240,1)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto sm:min-w-64"
    >
      {loading ? (
        <>
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Shown for a beat after the Stripe redirect, before the confirmation + score.
function FinalizingScreen() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
      <div className="relative grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/20" />
        <span className="relative grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Loader2 className="h-9 w-9 animate-spin" />
        </span>
      </div>
      <h1 className="mt-7 font-display text-2xl font-bold text-ink">
        Finalizing your protection…
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Confirming your payment and preparing your credit dashboard.
      </p>
    </div>
  );
}

function Confirmation({
  plan,
  cycle,
  email,
  accountReady,
}: {
  plan: Plan;
  cycle: BillingCycle;
  email: string;
  accountReady: boolean;
}) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="relative mx-auto grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-meter-excellent/30" />
        <span className="relative grid h-20 w-20 place-items-center rounded-full bg-meter-excellent text-white shadow-lg shadow-meter-excellent/30">
          <Check className="h-10 w-10" strokeWidth={3} />
        </span>
      </div>
      <h1 className="mt-7 font-display text-3xl font-bold text-ink">
        You&apos;re protected!
      </h1>
      <p className="mt-3 text-ink-soft">
        Welcome to Credio Pulse. We&apos;ve started monitoring your credit and
        identity. A confirmation has been sent to{" "}
        <span className="font-semibold text-ink">{email || "your email"}</span>.
      </p>

      {/* Credit score dashboard */}
      <div className="mt-8">
        <CreditScoreCard seed={email} />
      </div>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Your plan
            </p>
            <p className="font-display text-lg font-bold text-brand-600">
              {plan.name}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold text-ink">
              {money(totalDue(plan, cycle))}
            </p>
            <p className="text-xs text-ink-soft">
              billed {cycle} · {money(priceFor(plan, cycle))}/mo
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={accountReady ? "/account" : "/login?next=/account"}
          className="press group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white hover:-translate-y-0.5 hover:bg-brand-500"
        >
          {accountReady ? "Go to my dashboard" : "Log in to your dashboard"}
          <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
        </a>
        <a
          href="/"
          className="press inline-flex items-center justify-center rounded-xl border border-ink/15 bg-white px-6 py-3.5 font-semibold text-ink hover:border-brand-200 hover:bg-brand-50"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
