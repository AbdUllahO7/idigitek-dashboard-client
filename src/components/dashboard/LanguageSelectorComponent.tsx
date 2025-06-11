import { memo } from "react"
import { Check, ChevronDown, Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { cn } from "@/src/lib/utils"
import { useTranslation } from "react-i18next"

export const languages: { code: "en" | "ar" | "tr"; name: string; dir: "ltr" | "rtl" }[] = [
    { code: "en", name: "English", dir: "ltr" },
    { code: "ar", name: "العربية", dir: "rtl" },
    { code: "tr", name: "Türkçe", dir: "ltr" },
]

interface LanguageSelectorProps {
    currentLanguage: string
    onLanguageChange: (code: string) => void
    isMobile?: boolean
    }

function LanguageSelectorComponent({ currentLanguage, onLanguageChange, isMobile = false }: LanguageSelectorProps) {
    const { t } = useTranslation()
    
    const currentLangData = languages.find((lang) => lang.code === currentLanguage)

    if (isMobile) {
        return (
            <div className="mt-auto p-4 border-t dark:border-slate-700">
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-primary mb-2 font-medium">
                        {t("languageSelector.selectLanguage", "Select Language")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => onLanguageChange(lang.code)}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium",
                                    lang.code === currentLanguage
                                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                                        : "border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:bg-primary/5 text-slate-700 dark:text-slate-300"
                                )}
                                dir={lang.dir}
                            >
                                <span>{lang.name}</span>
                                {lang.code === currentLanguage && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300" dir={currentLangData?.dir}>
                    {currentLangData?.name || "Language"}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-500 dark:text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        className={cn(
                            "flex items-center justify-between cursor-pointer",
                            lang.code === currentLanguage && "bg-primary/10"
                        )}
                        dir={lang.dir}
                    >
                        <span className="text-sm">{lang.name}</span>
                        {lang.code === currentLanguage && (
                            <Check className="h-4 w-4 text-primary ml-2" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const LanguageSelector = memo(LanguageSelectorComponent)
export default LanguageSelector