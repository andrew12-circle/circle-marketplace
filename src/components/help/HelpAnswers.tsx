import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, ChevronRight } from 'lucide-react';
import { getFaqItems, type AgentFaqSection } from './faqProvider';

interface HelpAnswersProps {
  currentRoute: string;
}

export const HelpAnswers: React.FC<HelpAnswersProps> = ({ currentRoute }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [faqSections, setFaqSections] = useState<AgentFaqSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Load FAQ data on component mount
  useEffect(() => {
    getFaqItems()
      .then(setFaqSections)
      .catch((error) => {
        console.error('Error loading FAQ items:', error);
        setFaqSections([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter FAQs based on search
  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return faqSections;

    const query = searchQuery.toLowerCase();
    return faqSections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        item.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      )
    })).filter(section => section.items.length > 0);
  }, [faqSections, searchQuery]);

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* FAQ Content */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {loading ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Loading help content...
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              {searchQuery ? 'No results found. Try different keywords.' : 'No FAQs available.'}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {filteredFAQs.map((section, sectionIndex) => (
                <div key={section.title} className="space-y-1">
                  {filteredFAQs.length > 1 && (
                    <h4 className="font-medium text-sm text-primary mb-2">
                      {section.title}
                    </h4>
                  )}
                  {section.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={`${sectionIndex}-${itemIndex}`}
                      value={`${sectionIndex}-${itemIndex}`}
                      className="border rounded-lg px-3"
                    >
                      <AccordionTrigger className="text-left text-sm py-2 hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-3">
                        <div className="prose prose-sm">
                          {item.answer.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0">{line}</p>
                          ))}
                        </div>
                        {item.cta_text && item.cta_href && (
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs text-primary hover:text-primary/80"
                              onClick={() => window.open(item.cta_href, '_blank')}
                            >
                              <ChevronRight className="w-3 h-3 mr-1" />
                              {item.cta_text}
                            </Button>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};