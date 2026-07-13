import { ChevronDown } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function LanguageSelector() {
  const { language, languages, setLanguage, t } = useLanguage();
  const current = languages.find((item) => item.code === language) || languages[0];

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("language.select")}</span>
      <span className="pointer-events-none absolute left-3 text-base leading-none">
        {current.flag}
      </span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        title={t("language.select")}
        aria-label={t("language.select")}
        className="h-10 min-w-[92px] appearance-none rounded-lg border border-slate-200
          bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 shadow-sm
          outline-none transition hover:border-teal-400 focus:border-teal-500
          focus:ring-2 focus:ring-teal-100"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.flag} {item.shortLabel}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-2 text-slate-400"
      />
    </label>
  );
}
