import { ClaimCheckService } from './claim-check.service';

const service = new ClaimCheckService();

describe('ClaimCheckService', () => {
  it.each([
    ['Blends ice in 10 seconds', 'PERFORMANCE'],
    ['Helps you lose weight', 'HEALTH'],
    ['Guaranteed to last', 'GUARANTEE'],
    ['The best blender for travel', 'SUPERLATIVE'],
    ['Only ₱899 today', 'PRICE_STOCK'],
    ['Customers love it', 'TESTIMONIAL'],
    ['Pinakamura sa lahat', 'SUPERLATIVE'],
  ])('flags “%s” as %s', (text, category) => {
    expect(service.checkFact(text)?.category).toBe(category);
  });

  it.each([
    'Holds 380 ml',
    'Charges by USB-C',
    'BPA-free cup',
    '6 stainless-steel blades',
  ])('does not flag the plain fact “%s”', (text) => {
    expect(service.checkFact(text)).toBeNull();
  });

  it('does not re-flag wording the creator approved as a fact', () => {
    expect(
      service.checkText('Kaya nitong blends ice in 10 seconds'),
    ).toHaveLength(1);
    expect(
      service.checkText('Kaya nitong blends ice in 10 seconds', [
        'Blends ice in 10 seconds',
      ]),
    ).toHaveLength(0);
  });

  it('flags reported claims that are not approved facts', () => {
    const flags = service.checkClaimsAgainstFacts(
      ['Holds 380 ml', 'Blends ice in 10 seconds'],
      ['Holds 380 ml', 'Charges by USB-C'],
    );

    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      category: 'NOT_APPROVED_FACT',
      claim: 'Blends ice in 10 seconds',
    });
  });
});
