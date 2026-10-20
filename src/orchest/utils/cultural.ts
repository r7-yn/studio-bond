export type SeasonalThemeKey = "default" | "ramadan" | "eid" | "national_day" | "wedding_season";

export interface CulturalGreeting {
  greeting: string;
  subtext: string;
}

export interface SeasonalTheme {
  key: SeasonalThemeKey;
  label: string;
  greeting: string;
  subtext: string;
  icon: "moon" | "sparkles" | "crown" | "heart" | "flag";
}

export function getCulturalGreeting(date: Date = new Date()): CulturalGreeting {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) {
    return {
      greeting: "صباح التألق والسعادة",
      subtext: "استوديو أوركست يتمنى لكم يوماً حافلاً بالمسرات",
    };
  }
  if (hours >= 12 && hours < 17) {
    return {
      greeting: "طاب مساؤكم بكل خير",
      subtext: "نسعد بتنفيذ أرقى زفاتكم ومناسباتكم الخاصة",
    };
  }
  return {
    greeting: "مساء الفخامة والبهجة",
    subtext: "بصمتكم الصوتية الملكية تبدأ من هنا",
  };
}

export function getSeasonalTheme(
  date: Date = new Date(),
  forcedTheme?: SeasonalThemeKey,
): SeasonalTheme {
  if (forcedTheme) {
    const themes: Record<SeasonalThemeKey, SeasonalTheme> = {
      default: {
        key: "default",
        label: "الهوية الملكية",
        greeting: "تفاصيل صغيرة، أثر كبير",
        subtext: "زفات وشيلات مصممة حول مناسبتكم",
        icon: "sparkles",
      },
      ramadan: {
        key: "ramadan",
        label: "نفحات رمضانية",
        greeting: "رمضان مبارك، وأفراحكم عامرة",
        subtext: "اختيارات صوتية تليق بأمسياتكم الرمضانية",
        icon: "moon",
      },
      eid: {
        key: "eid",
        label: "عرض العيد",
        greeting: "عيدكم مبارك وأيامكم عامرة بالأفراح",
        subtext: "اختيارات احتفالية لمناسباتكم العائلية",
        icon: "sparkles",
      },
      national_day: {
        key: "national_day",
        label: "احتفالات الوطن",
        greeting: "دام عزك يا وطن",
        subtext: "شيلات وطنية تليق بمناسباتكم الكبرى",
        icon: "flag",
      },
      wedding_season: {
        key: "wedding_season",
        label: "موسم الزفات الكبرى",
        greeting: "ليلتكم تستحق بصمة لا تتكرر",
        subtext: "اكتشفوا اختياراتنا الفاخرة لموسم الأعراس",
        icon: "crown",
      },
    };
    return themes[forcedTheme] ?? themes.default;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 9) {
    return {
      key: "national_day",
      label: "احتفالات الوطن",
      greeting: "دام عزك يا وطن",
      subtext: "شيلات وطنية تليق بمناسباتكم الكبرى",
      icon: "flag",
    };
  }
  if (month >= 10 || month <= 4) {
    return {
      key: "wedding_season",
      label: "موسم الزفات الكبرى",
      greeting: "ليلتكم تستحق بصمة لا تتكرر",
      subtext: "اكتشفوا اختياراتنا الفاخرة لموسم الأعراس",
      icon: "crown",
    };
  }
  if (month === 5 && day <= 10) {
    return {
      key: "eid",
      label: "عرض العيد",
      greeting: "عيدكم مبارك وأيامكم عامرة بالأفراح",
      subtext: "اختيارات احتفالية لمناسباتكم العائلية",
      icon: "sparkles",
    };
  }
  return {
    key: "default",
    label: "الهوية الملكية",
    greeting: "تفاصيل صغيرة، أثر كبير",
    subtext: "زفات وشيلات مصممة حول مناسبتكم",
    icon: "sparkles",
  };
}
