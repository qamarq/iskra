import type { EvidenceKind, FactStatus, ImplementationLevel, InnovationArea, InnovationCharacter, InstitutionType, TargetGroup } from "./card"
import type { EventKind, InnovationStatus, PartnerKind, Recommendation, SourceKind } from "./domain"

export const AREA_LABEL: Record<InnovationArea, string> = {
  technologiczna: "Technologiczna",
  edukacyjna: "Edukacyjna",
  administracyjna: "Administracyjna",
}

export const CHARACTER_LABEL: Record<InnovationCharacter, string> = {
  produkt: "Produkt",
  usluga: "Usługa",
  proces: "Proces",
  metoda: "Metoda",
  organizacja: "Organizacja",
}

export const STAGE_LABEL: Record<ImplementationLevel, string> = {
  koncepcja: "Koncepcja",
  prototyp: "Prototyp",
  testy: "Testy",
  pilotaz: "Wdrożenie pilotażowe",
  stosowane: "Stosowane w praktyce",
}

export const STATUS_LABEL: Record<InnovationStatus, string> = {
  nowa: "Nowa (niezweryfikowana)",
  zweryfikowana: "Zweryfikowana",
  odrzucona: "Odrzucona",
}

export const EVENT_LABEL: Record<EventKind, string> = {
  dodana: "Dodana do radaru",
  ocena: "Ocena",
  nowe_zrodlo: "Nowe źródło",
  zweryfikowana: "Zweryfikowana przez analityka",
  odrzucona: "Odrzucona",
  korekta_oceny: "Korekta oceny",
  aktualizacja: "Aktualizacja",
}

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  wdrozenie: "Gotowe do zastosowania w innych miejscach",
  licencja: "Do licencjonowania (polskie IP)",
  pilotaz: "Warte pilotażu",
  rozwoj: "Do dalszego rozwoju",
  weryfikacja: "Wymaga potwierdzenia w źródłach",
}

export const RECOMMENDATION_SHORT: Record<Recommendation, string> = {
  wdrozenie: "Do zastosowania",
  licencja: "Licencja",
  pilotaz: "Pilotaż",
  rozwoj: "Rozwój",
  weryfikacja: "Do weryfikacji",
}

export const TARGET_GROUP_LABEL: Record<TargetGroup, string> = {
  inwestorzy: "Inwestorzy i firmy",
  instytucje_publiczne: "Instytucje publiczne i samorządy",
  uczelnie: "Uczelnie i jednostki naukowe",
  szkoly: "Szkoły i placówki edukacyjne",
  startupy: "Startupy i przedsiębiorstwa",
  innowatorzy: "Innowatorzy i wynalazcy",
}

export const TARGET_GROUP_SHORT: Record<TargetGroup, string> = {
  inwestorzy: "Inwestorzy",
  instytucje_publiczne: "Samorządy",
  uczelnie: "Uczelnie",
  szkoly: "Szkoły",
  startupy: "Startupy",
  innowatorzy: "Wynalazcy",
}

export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  patent: "Patent",
  zgloszenie_patentowe: "Zgłoszenie patentowe",
  publikacja: "Publikacja",
  projekt_finansowany: "Projekt finansowany",
  raport: "Raport",
  dane_z_wdrozenia: "Dane z wdrożenia",
  nagroda: "Nagroda",
  media: "Media",
}

export const FACT_STATUS_LABEL: Record<FactStatus, string> = {
  potwierdzone: "potwierdzone",
  szacunek: "szacunek",
  brak: "brak danych",
}

export const PARTNER_KIND_LABEL: Record<PartnerKind, string> = {
  jst: "Samorząd",
  szkola: "Szkoła",
  uczelnia: "Uczelnia",
  firma: "Firma",
  inwestor: "Inwestor",
  program: "Program",
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
  firma: "Firma",
  inna: "Inna instytucja",
}

export const SOURCE_LABEL: Record<SourceKind, string> = {
  analiza: "Analiza linku",
  www: "Strona instytucji",
  cordis: "CORDIS",
  openalex: "OpenAlex",
  ncbr: "NCBR",
  uprp: "UPRP",
  epo: "EPO",
  pbn: "PBN",
  import: "Dane startowe",
}

export const REGION_LABEL: Record<string, string> = {
  podkarpackie: "Podkarpackie",
  dolnoslaskie: "Dolnośląskie",
}

export function credibilityLabel(score: number | null | undefined): string {
  if (score == null) return "brak"
  if (score >= 70) return "wysoka"
  if (score >= 45) return "średnia"
  return "niska"
}

export function percent(value: number | null | undefined): string {
  return value == null ? "–" : `${Math.round(value * 100)}%`
}
