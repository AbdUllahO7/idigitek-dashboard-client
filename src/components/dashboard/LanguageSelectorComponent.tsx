import { memo } from "react"
import { Check, ChevronDown, Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/src/lib/utils";


export const languages: { code: "en" | "ar"; name: string; dir: "ltr" | "rtl" }[] = [
    { code: "en", name: "English", dir: "ltr" },
    { code: "ar", name: "العربية", dir: "rtl" },
]


interface LanguageSelectorProps {
    currentLanguage: string
    onLanguageChange: (code: string) => void
    isMobile?: boolean
}

function LanguageSelectorComponent({ currentLanguage, onLanguageChange, isMobile = false }: LanguageSelectorProps) {
    if (isMobile) {
        return (
        <div className="mt-auto p-4 border-t">
            <div className="flex flex-col gap-2">
            <p className="text-sm text-primary mb-2">Select Language</p>
            <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all",
                    lang.code === currentLanguage
                        ? "border-main bg-main/10 text- font-medium"
                        : "border-gray-200 hover:border-main/30 hover:bg-main/5"
                    )}
                >
                    {lang.name}
                    {lang.code === currentLanguage && <Check className="h-4 w-4" />}
                </button>
                ))}
            </div>
            </div>
        </div>
        );
    }

    return (
        <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full border   transition-colors">
            <Globe className="h-4 w-4 text-main" />
            <span className="text-sm font-bold tracking-tight  text-green-600  bg-clip-text ">{languages.find((lang) => lang.code === currentLanguage)?.name}</span>
            <ChevronDown className="h-3 w-3 text-gray-500 ms-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {languages.map((lang) => (
            <DropdownMenuItem
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className="flex items-center justify-between"
            >
                <span>{lang.name}</span>
                {lang.code === currentLanguage && <Check className="h-4 w-4 ms-2 text-main" />}
            </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const LanguageSelector = memo(LanguageSelectorComponent);
export default LanguageSelector;