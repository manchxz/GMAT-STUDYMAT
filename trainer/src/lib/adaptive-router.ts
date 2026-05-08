/**
 * Adaptive Question Router — CAT-lite / multi-dimensional routing
 *
 * Goal: serve items slightly above comfort zone (+~0.3 to +0.5 on latent scale).
 * Uses 3-parameter logistic-inspired information heuristic (simplified Fisher info).
 */

export type RoutableQuestion = {
  id: string;
  skillIds: string[];
  difficulty: number; // item theta (latent difficulty center)
  discrimination: number;
  guessing: number;
};

export type SkillTheta = Record<string, number>;

const TARGET_OFFSET = 0.45; // ask slightly above estimate

/** 3PL probability P(correct | theta) */
export function probability3pl(
  theta: number,
  itemTheta: number,
  a = 1,
  c = 0.2
): number {
  const x = Math.max(-80, Math.min(80, a * (theta - itemTheta)));
  const p = c + (1 - c) / (1 + Math.exp(-x));
  return Math.min(0.999, Math.max(c, p));
}

/** Fisher information for 3PL (approx): I(theta) approx a² * [(P-c)/(1-c)]² * (1-P)/(P-q) simplified */
export function itemInformation(theta: number, q: RoutableQuestion): number {
  const a = Math.max(0.2, q.discrimination);
  const c = Math.min(0.35, Math.max(0.05, q.guessing));
  const P = probability3pl(theta, q.difficulty, a, c);
  const pStar = Math.max(P, c + 0.001);
  const denom = Math.max((1 - P) * (P - c), 0.0001);
  // stable numerical variant of classic 3PL information
  return (a ** 2) * ((pStar - c) ** 2 / (1 - c) ** 2) * ((P * (1 - P)) / (denom ** 2 + 1e-6));
}

/** Blend user theta across weighted skills touched by the question */
export function blendedTheta(skillThetas: SkillTheta, skillIds: string[], weights?: number[]): number {
  let sum = 0;
  let wsum = 0;
  skillIds.forEach((sid, i) => {
    const w = weights?.[i] ?? 1;
    sum += w * (skillThetas[sid] ?? 0);
    wsum += w;
  });
  return wsum ? sum / wsum : 0;
}

export type RouteOptions = {
  skillFocus?: string | null;
  excludedIds?: Set<string>;
  maxSuggestions?: number;
};

/**
 * Select next adaptive item: maximize Fisher information subject to mild difficulty floor/ceiling
 * vs user blended theta (+ offset toward challenge).
 */
export function selectNextAdaptive(
  candidates: RoutableQuestion[],
  skillThetas: SkillTheta,
  opts: RouteOptions = {}
): RoutableQuestion | null {
  const excluded = opts.excludedIds ?? new Set();
  const filtered = candidates.filter((q) => !excluded.has(q.id));
  if (!filtered.length) return null;

  const weighted = filtered.map((q) => {
    const thetaHat = blendedTheta(skillThetas, q.skillIds);
    const augmented = thetaHat + TARGET_OFFSET;

    let info = itemInformation(thetaHat + TARGET_OFFSET / 3, q);
    // Mild boost if routing is skill-focused & question hits that skill
    if (opts.skillFocus && q.skillIds.includes(opts.skillFocus)) {
      info *= 1.08;
    }
    const challengeGap = augmented - q.difficulty;
    let bonus = Math.exp(-(challengeGap * challengeGap) / 2);
    info *= 0.4 + bonus * 1.6;
    return { q, info };
  });

  weighted.sort((a, b) => b.info - a.info);
  return weighted[0]?.q ?? null;
}

export type PickManyOptions = RouteOptions & { count: number };

export function selectAdaptiveSeries(
  pool: RoutableQuestion[],
  skillThetas: SkillTheta,
  opts: PickManyOptions
): RoutableQuestion[] {
  const out: RoutableQuestion[] = [];
  const used = new Set(opts.excludedIds ?? []);
  const count = Math.max(1, opts.count);
  for (let i = 0; i < count; i++) {
    const next = selectNextAdaptive(pool, skillThetas, {
      skillFocus: opts.skillFocus,
      excludedIds: used,
    });
    if (!next) break;
    out.push(next);
    used.add(next.id);
  }
  return out;
}
