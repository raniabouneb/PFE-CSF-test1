import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min"

type ValidatePhoneOptions = {
  required?: boolean
  defaultCountry?: CountryCode
}

export const DEFAULT_PHONE_COUNTRY: CountryCode = "TN"

export type PhoneCountryOption = {
  code: CountryCode
  dialCode: string
  label: string
}

export function getPhoneCountryOptions(locale = "fr"): PhoneCountryOption[] {
  const displayNames =
    typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames([locale], { type: "region" })
      : null

  const options = getCountries().map((code) => {
    const dialCode = getCountryCallingCode(code)
    const countryName = displayNames?.of(code) || code
    return {
      code,
      dialCode,
      label: `${countryName} (+${dialCode})`,
    }
  })

  options.sort((a, b) => a.label.localeCompare(b.label, locale))
  const idx = options.findIndex((o) => o.code === DEFAULT_PHONE_COUNTRY)
  if (idx > 0) {
    const [tn] = options.splice(idx, 1)
    if (tn) options.unshift(tn)
  }
  return options
}

export function detectDefaultCountryFromLocale(): CountryCode | undefined {
  if (typeof navigator === "undefined") return undefined
  const lang = navigator.language || ""
  const region = lang.split("-")[1]?.toUpperCase()
  if (!region) return undefined
  return isSupportedCountry(region) ? (region as CountryCode) : undefined
}

export function detectPhoneCountry(
  phone: string,
  fallbackCountry?: CountryCode,
): CountryCode | undefined {
  const formatter = new AsYouType(fallbackCountry)
  formatter.input(phone)
  return formatter.getCountry() ?? fallbackCountry
}

export function validatePhoneStructure(
  phone: string,
  options?: ValidatePhoneOptions,
): string | null {
  const normalized = phone.trim()
  const required = options?.required ?? true
  const defaultCountry = options?.defaultCountry

  if (!normalized) return required ? "Téléphone requis." : null

  const parsed = parsePhoneNumberFromString(normalized, defaultCountry)
  if (!parsed || !parsed.isValid()) {
    return "Format de téléphone invalide."
  }
  return null
}
