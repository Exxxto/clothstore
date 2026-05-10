export type CanonicalGender = "men" | "women" | "kids";

const GENDER_ALIASES: Record<string, CanonicalGender> = {
  men: "men",
  man: "men",
  male: "men",
  "мужское": "men",
  "мужские": "men",
  "мужской": "men",
  "для мужчин": "men",
  women: "women",
  woman: "women",
  female: "women",
  "женское": "women",
  "женские": "women",
  "женский": "women",
  "для женщин": "women",
  kids: "kids",
  child: "kids",
  children: "kids",
  "детское": "kids",
  "детские": "kids",
  "детский": "kids",
  "для детей": "kids",
};

export function normalizeGenderInput(value?: string | null): CanonicalGender | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  return GENDER_ALIASES[normalized];
}
