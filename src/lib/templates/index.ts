import { IndustryTemplate } from './types';
import { FashionIndustryTemplate } from './fashion';

const templates: Record<string, IndustryTemplate> = {
  fashion: FashionIndustryTemplate,
};

export function getTemplate(industryType: string = 'fashion'): IndustryTemplate {
  return templates[industryType] || FashionIndustryTemplate;
}

export { FashionIndustryTemplate };
export type { IndustryTemplate, DefaultFAQ, IntentRule } from './types';
