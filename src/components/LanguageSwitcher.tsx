import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Globe } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const { location } = useLocation();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setOpen(false);
    
    // Store the user's preference
    localStorage.setItem('preferredLanguage', languageCode);
  };

  // Auto-detect currency based on location and language
  const getCurrency = () => {
    // Canadian provinces and territories
    const canadianProvinces = [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 
      'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 
      'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
      'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
    ];
    
    if (location?.state && canadianProvinces.some(province => 
      province.toLowerCase() === location.state?.toLowerCase()
    )) {
      return 'CAD';
    }
    return 'USD';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm">{currentLanguage.flag}</span>
          <span className="hidden sm:inline text-sm">{currentLanguage.code.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        <div className="space-y-1">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center gap-3 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors ${
                currentLanguage.code === language.code ? 'bg-accent' : ''
              }`}
            >
              <span className="text-base">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">{language.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
        <div className="border-t mt-2 pt-2 px-2">
          <div className="text-xs text-muted-foreground">
            Currency: {getCurrency()}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};