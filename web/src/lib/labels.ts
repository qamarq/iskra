import type { InnovationType, InstitutionType, MaturityStage } from "./card"
import type { InnovationStatus, MatchStatus, PartnerKind, Pathway, SourceKind } from "./domain"

export const TYPE_LABEL: Record<InnovationType, string> = {
  technologiczna: "Technologiczna",
  organizacyjna: "Organizacyjna",
  edukacyjna: "Edukacyjna",
  spoleczna: "Społeczna",
  procesowa: "Procesowa",
}

export const STAGE_LABEL: Record<MaturityStage, string> = {
  pomysl: "Pomysł",
  prototyp: "Prototyp",
  pilotaz: "Pilotaż",
  wdrozone: "Wdrożone",
  efekty_zmierzone: "Wdrożone, efekty zmierzone",
}

export const STATUS_LABEL: Record<InnovationStatus, string> = {
  wykryta: "Wykryta",
  zweryfikowana: "Zweryfikowana",
  oceniona: "Oceniona",
  rekomendowana: "Rekomendowana",
  w_kontakcie: "W kontakcie",
  pilotaz: "Pilotaż",
  wdrozona: "Wdrożona",
  odrzucona: "Odrzucona",
}

export const PATHWAY_LABEL: Record<Pathway, string> = {
  transfer: "Transfer do innych instytucji",
  komercjalizacja: "Komercjalizacja",
  prototypowanie: "Prototypowanie i akceleracja",
  finansowanie: "Pozyskanie finansowania",
  pilotaz: "Pilotaż u partnera",
  uzupelnienie: "Uzupełnienie informacji",
}

export const PATHWAY_SHORT: Record<Pathway, string> = {
  transfer: "Transfer",
  komercjalizacja: "Komercjalizacja",
  prototypowanie: "Prototyp",
  finansowanie: "Finansowanie",
  pilotaz: "Pilotaż",
  uzupelnienie: "Uzupełnienie",
}

export const PARTNER_KIND_LABEL: Record<PartnerKind, string> = {
  jst: "Samorząd",
  szkola: "Szkoła",
  uczelnia: "Uczelnia",
  firma: "Firma",
  inwestor: "Inwestor",
  program: "Program finansowania",
  ctt: "Centrum transferu technologii",
  akcelerator: "Akcelerator",
  ngo: "Organizacja pozarządowa",
}

export const INSTITUTION_TYPE_LABEL: Record<InstitutionType, string> = {
  gmina: "Gmina",
  powiat: "Powiat",
  wojewodztwo: "Województwo",
  szkola: "Szkoła",
  uczelnia: "Uczelnia",
  instytut: "Instytut",
  inna: "Inna instytucja",
}

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  zaproponowane: "Zaproponowane",
  wyslane: "Wysłane",
  zainteresowany: "Zainteresowany",
  odrzucone: "Odrzucone",
}

export const SOURCE_LABEL: Record<SourceKind, string> = {
  zgloszenie: "Zgłoszenie",
  www: "Strona instytucji",
  ncbr: "NCBR",
  interreg: "Interreg",
  pbn: "PBN",
  uprp: "UPRP",
  epo: "EPO",
}

export function confidenceLabel(confidence: number | null | undefined): string {
  if (confidence == null) return "brak"
  if (confidence >= 0.7) return "wysoka"
  if (confidence >= 0.45) return "średnia"
  return "niska"
}

export function percent(value: number | null | undefined): string {
  return value == null ? "–" : `${Math.round(value * 100)}%`
}
