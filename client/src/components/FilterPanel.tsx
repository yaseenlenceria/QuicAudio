import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Globe, Languages, Smile, Users } from 'lucide-react';

export interface Filters {
  countries: string[];
  languages: string[];
  moods: string[];
  ageRange?: { min: number; max: number };
}

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  className?: string;
}

const MOODS = ['Happy', 'Chill', 'Talkative', 'Creative', 'Thoughtful', 'Energetic'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Chinese', 'Japanese', 'Korean', 'Hindi'];
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
];

export function FilterPanel({ filters, onFiltersChange, className = '' }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMood = (mood: string) => {
    const newMoods = filters.moods.includes(mood)
      ? filters.moods.filter(m => m !== mood)
      : [...filters.moods, mood];
    onFiltersChange({ ...filters, moods: newMoods });
  };

  const toggleLanguage = (language: string) => {
    const newLanguages = filters.languages.includes(language)
      ? filters.languages.filter(l => l !== language)
      : [...filters.languages, language];
    onFiltersChange({ ...filters, languages: newLanguages });
  };

  const toggleCountry = (countryCode: string) => {
    const newCountries = filters.countries.includes(countryCode)
      ? filters.countries.filter(c => c !== countryCode)
      : [...filters.countries, countryCode];
    onFiltersChange({ ...filters, countries: newCountries });
  };

  return (
    <div className={className}>
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between"
        data-testid="button-toggle-filters"
      >
        <span className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Filter Preferences
          {(filters.countries.length > 0 || filters.languages.length > 0 || filters.moods.length > 0) && (
            <Badge variant="secondary" className="ml-2">
              {filters.countries.length + filters.languages.length + filters.moods.length}
            </Badge>
          )}
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {isExpanded && (
        <Card className="mt-4 p-6" data-testid="filter-panel-content">
          <div className="space-y-6">
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Smile className="w-4 h-4" />
                Mood
              </Label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <Badge
                    key={mood}
                    variant={filters.moods.includes(mood) ? 'default' : 'outline'}
                    className="cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => toggleMood(mood)}
                    data-testid={`badge-mood-${mood.toLowerCase()}`}
                  >
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Languages className="w-4 h-4" />
                Languages
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {LANGUAGES.map((language) => (
                  <Badge
                    key={language}
                    variant={filters.languages.includes(language) ? 'default' : 'outline'}
                    className="cursor-pointer hover-elevate active-elevate-2 justify-center"
                    onClick={() => toggleLanguage(language)}
                    data-testid={`badge-language-${language.toLowerCase()}`}
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4" />
                Countries
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {COUNTRIES.map((country) => (
                  <Badge
                    key={country.code}
                    variant={filters.countries.includes(country.code) ? 'default' : 'outline'}
                    className="cursor-pointer hover-elevate active-elevate-2 justify-center"
                    onClick={() => toggleCountry(country.code)}
                    data-testid={`badge-country-${country.code.toLowerCase()}`}
                  >
                    {country.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
