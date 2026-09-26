import { Injectable } from '@nestjs/common';
import { ClaimFlagCategory } from 'src/graphql/generated/graphql';

export interface ClaimFlag {
  category: ClaimFlagCategory;
  /** The lead sentence shown in bold (“Performance claim.”). */
  lead: string;
  reason: string;
  /** The wording that triggered the flag. */
  claim: string;
}

interface ClaimRule {
  category: Exclude<ClaimFlagCategory, ClaimFlagCategory.NOT_APPROVED_FACT>;
  lead: string;
  reason: string;
  pattern: RegExp;
}

/**
 * Deterministic claim rules (brief §10 “Claim checks”). English plus common
 * Filipino terms, since scripts may be Filipino or Taglish. These are prompts,
 * not verdicts: a flag never blocks approving a fact, but it does block
 * approving a script version until the line changes or its claim is approved.
 */
const RULES: ClaimRule[] = [
  {
    category: ClaimFlagCategory.PERFORMANCE,
    lead: 'Performance claim.',
    reason:
      'Speed and results claims need proof the listing doesn’t show. Approve it only if you’ve checked it yourself.',
    pattern:
      /\b(?:in|within|under|sa loob ng)\s+\d+(?:\.\d+)?\s*(?:seconds?|secs?|minutes?|mins?|segundo|minuto)\b|\b\d+\s*x\s+(?:faster|stronger|better)\b|\b(?:instantly|in seconds|super[- ]?fast|lightning[- ]fast|fastest|agad-agad)\b/i,
  },
  {
    category: ClaimFlagCategory.HEALTH,
    lead: 'Health claim.',
    reason:
      'Health and safety outcomes need proof. Say what the product is, not what it does to your body.',
    pattern:
      /\b(?:cures?|cured|heals?|treats?|detox\w*|weight loss|lose weight|burns? fat|boosts? (?:your )?immun\w*|healthier|clinically|doctor[- ]recommended|medical[- ]grade|nakakapayat|pampapayat|gamot)\b/i,
  },
  {
    category: ClaimFlagCategory.GUARANTEE,
    lead: 'Guarantee.',
    reason:
      'Guarantees promise results you can’t control. Say what the product does instead.',
    pattern:
      /\b(?:guarantee[sd]?|never (?:breaks|fails|leaks)|lifetime|risk[- ]free|garantisado|siguradong)\b|100\s?%/i,
  },
  {
    category: ClaimFlagCategory.SUPERLATIVE,
    lead: 'Superlative.',
    reason:
      'Superlatives like ‘best’ or ‘#1’ need proof. Describe the specific feature instead.',
    pattern:
      /(?:#\s?1\b)|\b(?:best|no\.?\s?1|number one|perfect|the only|world'?s \w+est|pinaka\w+)\b/i,
  },
  {
    category: ClaimFlagCategory.PRICE_STOCK,
    lead: 'Price or stock claim.',
    reason:
      'Prices and stock change. Point viewers to the listing instead of stating them.',
    pattern:
      /₱\s?\d|\b(?:php\s?\d|pesos?|cheapest|on sale|\d+\s?% off|discount\w*|limited stock|sold out|free shipping|mura|pinakamura)\b/i,
  },
  {
    category: ClaimFlagCategory.TESTIMONIAL,
    lead: 'Testimonial.',
    reason:
      'Unsourced reviews can mislead. Only quote reviews you can point to.',
    pattern:
      /\b(?:customers? (?:say|love)|everyone (?:loves|says)|rated \d|\d(?:\.\d)?\s?stars?|reviews? say|trusted by|sabi ng (?:lahat|customers?))\b/i,
  },
];

export function normalizeClaim(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[‘’“”"']/g, '')
    .replace(/[^\p{L}\p{N}₱%#.\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class ClaimCheckService {
  /** The first rule a fact's wording triggers, if any (one flag per row). */
  checkFact(text: string): ClaimFlag | null {
    return this.checkText(text)[0] ?? null;
  }

  /**
   * Rule flags for a line of script, one per category. Wording that matches an
   * approved fact is exempt, so a claim the creator approved is not re-flagged.
   */
  checkText(text: string, approvedFactTexts: string[] = []): ClaimFlag[] {
    let remaining = normalizeClaim(text);

    for (const fact of approvedFactTexts) {
      const normalizedFact = normalizeClaim(fact);
      if (normalizedFact) {
        remaining = remaining.split(normalizedFact).join(' ');
      }
    }

    const flags: ClaimFlag[] = [];

    for (const rule of RULES) {
      const match = remaining.match(rule.pattern);
      if (match) {
        flags.push({
          category: rule.category,
          lead: rule.lead,
          reason: rule.reason,
          claim: match[0].trim(),
        });
      }
    }

    return flags;
  }

  /**
   * Flags each claim a draft reports that isn't one of the approved facts.
   * A claim matches when either normalized text contains the other.
   */
  checkClaimsAgainstFacts(
    claims: string[],
    approvedFactTexts: string[],
  ): ClaimFlag[] {
    const facts = approvedFactTexts.map(normalizeClaim).filter(Boolean);

    return claims
      .map((claim) => claim.trim())
      .filter(Boolean)
      .filter((claim) => {
        const normalized = normalizeClaim(claim);
        return !facts.some(
          (fact) => fact.includes(normalized) || normalized.includes(fact),
        );
      })
      .map((claim) => ({
        category: ClaimFlagCategory.NOT_APPROVED_FACT,
        lead: 'Not an approved fact.',
        reason: `‘${claim}’ isn’t one of your approved facts. Edit the line, or add it as a fact and approve it.`,
        claim,
      }));
  }
}
