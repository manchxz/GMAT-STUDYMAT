

const { Section, PracticeTier } = require('@prisma/client');

const KEYS = ['A', 'B', 'C', 'D', 'E'];

function mix(i, salt = '') {
  let h = (i + 0x9e3779b9 + salt.length * 911) >>> 0;
  for (let c = 0; c < salt.length; c++) {
    h = Math.imul(h ^ salt.charCodeAt(c), 0x85ebca6b) >>> 0;
  }
  return h >>> 0;
}

function pickSkill(list, i) {
  return list[i % list.length];
}


function irtDifficulty(tier, slot) {
  const u = mix(slot, tier + 'irtb') / 4294967296;
  if (tier === PracticeTier.EASY) return Math.round((-1.08 + u * 0.66) * 100) / 100;
  if (tier === PracticeTier.MID) return Math.round((-0.36 + u * 0.94) * 100) / 100;
  return Math.round((0.62 + u * 1.38) * 100) / 100;
}

const QUANT_SKILLS = [
  'NUMBER_PROPERTIES',
  'ALGEBRAIC_LOGIC',
  'RATES_WORK',
  'PERCENT_FRACTION',
  'GEOMETRY_AREA',
  'PROBABILITY_SIMPLE',
  'INEQUALITIES_LINEAR',
];

const VERBAL_SKILLS = [
  'CR_ASSUMPTION',
  'CR_WEAKEN',
  'CR_STRENGTHEN',
  'SC_SUBJECT_VERB',
  'SC_PARALLELISM',
  'SC_PRONOUN',
  'CR_INFERENCE',
];

const DI_SKILLS = ['TABLE_READING', 'GRAPH_TRENDS', 'MULTI_SOURCE_SIMPLE'];


const PER_TIER = 100;

function skillCodeForSlot(section, tier, indexInTier) {
  const idx =
    tier === PracticeTier.HARD
      ? indexInTier
      : tier === PracticeTier.MID
        ? indexInTier * 2 + 3
        : indexInTier * 2 + 1;
  if (section === Section.QUANT) return QUANT_SKILLS[idx % QUANT_SKILLS.length];
  if (section === Section.VERBAL) return VERBAL_SKILLS[idx % VERBAL_SKILLS.length];
  return DI_SKILLS[idx % DI_SKILLS.length];
}

function quantEasy(slot) {
  const m = mix(slot, 'qe');
  const kind = mix(slot, 'qek') % 10;
  if (kind === 0) {
    const a = 2 + (m % 7);
    const x = 3 + (mix(slot, 'x') % 15);
    const b = a * x;
    const pool = new Set([x]);
    let z = 1;
    while (pool.size < 5) {
      pool.add(x + z);
      pool.add(x - z);
      pool.add(a + z);
      z += 1;
    }
    const texts = [...pool].slice(0, 5);
    const choices = shuffleChoices(
      slot,
      KEYS.map((k, i) => ({ key: k, text: String(texts[i] ?? x + i) }))
    );
    const correct =
      choices.find((c) => c.text === String(x))?.key ?? choices[0].key;
    return {
      stemMd: `If \`${a}x = ${b}\` and \`x\` is a real number, what is \`x\`?`,
      choicesJson: choices,
      correctKey: correct,
      eli5: 'Divide both sides by the coefficient of `x` to isolate `x`.',
      expert: `\`${a}x=${b}\` ⇒ \`x=${b}/${a}=${x}\`.`,
      title: 'Linear isolate x',
      slug: `gen-quant-e-${slot}`,
    };
  }
  if (kind === 1) {
    const p = [5, 8, 10, 12, 15, 20, 25, 30][m % 8];
    const n = 40 + (mix(slot, 'n') % 12) * 5;
    const ans = Math.round((p * n) / 100);
    const choices = buildNumericChoices(ans, slot, m);
    return {
      stemMd: `What is \`${p}%\` of \`${n}\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Percent means "per hundred": multiply by the percent, then divide by 100.',
      expert: `\`${p}\% \times ${n} = ${ans}\`.`,
      title: 'Percent of a number',
      slug: `gen-quant-e2-${slot}`,
    };
  }
  if (kind === 2) {
    const L = 4 + (m % 9);
    const W = 3 + (mix(slot, 'w') % 8);
    const P = 2 * (L + W);
    const choices = buildNumericChoices(P, slot, m);
    return {
      stemMd: `A rectangle has length \`${L}\` and width \`${W}\`. What is its perimeter?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Perimeter is the total distance around: twice length plus twice width.',
      expert: '`P = 2(L+W)`',
      title: 'Rectangle perimeter',
      slug: `gen-quant-e3-${slot}`,
    };
  }
  if (kind === 3) {
    const a = 10 + (m % 20);
    const b = 20 + (mix(slot + 1) % 25);
    const avg = (a + b) / 2;
    const choices = buildNumericChoices(avg, slot, m);
    return {
      stemMd: `What is the average (arithmetic mean) of \`${a}\` and \`${b}\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Add the two numbers and divide by 2.',
      expert: `\`(${a}+${b})/2 = ${avg}\`.`,
      title: 'Mean of two',
      slug: `gen-quant-e4-${slot}`,
    };
  }
  if (kind === 4) {
    const whole = 24 + (m % 10) * 2;
    const half = whole / 2;
    const choices = buildNumericChoices(half, slot, m);
    return {
      stemMd: `What is \`\\frac{1}{2}\` of \`${whole}\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'One-half of a number is that number divided by 2.',
      expert: `\`${whole}/2 = ${half}\`.`,
      title: 'Half of whole',
      slug: `gen-quant-e5-${slot}`,
    };
  }
  if (kind === 5) {
    const n = 18 + (m % 14) * 2;
    const mult = 3;
    const ans = n * mult;
    const choices = buildNumericChoices(ans, slot, m);
    return {
      stemMd: `\`${mult}\` times \`${n}\` equals what number?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Multiplication repeats addition.',
      expert: `\`${mult}\times ${n}=${ans}\`.`,
      title: 'Integer times table',
      slug: `gen-quant-e6a-${slot}`,
    };
  }
  if (kind === 6) {
    const start = 50 + (m % 40);
    const delta = 8 + (mix(slot) % 12);
    const ans = start + delta;
    const choices = buildNumericChoices(ans, slot, m);
    return {
      stemMd: `A temperature starts at \`${start}^\\circ\` and rises by \`${delta}^\\circ\`. What is the new temperature?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Add the increase to the starting value.',
      expert: `\`${start}+${delta}=${ans}\`.`,
      title: 'Additive change',
      slug: `gen-quant-e7-${slot}`,
    };
  }
  return quantEasyExtra(slot, kind);
}


function quantEasyExtra(slot, kindNum) {
  const m = mix(slot, 'qeX');
  if (kindNum === 7) {
    const n = 11 + (m % 8);
    const sq = n * n;
    const choices = buildNumericChoices(sq, slot, m);
    return {
      stemMd: `What is \`${n}^2\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Square means multiply the number by itself.',
      expert: `\`${n}^2 = ${sq}\`.`,
      title: 'Integer square',
      slug: `gen-quant-e8-${slot}`,
    };
  }
  if (kindNum === 8) {
    const a = 5 + (m % 6);
    const b = 4 + (mix(slot) % 5);
    const prod = a * b;
    const choices = buildNumericChoices(prod, slot, m);
    return {
      stemMd: `What is \`${a} \\times ${b}\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Multiply the two integers.',
      expert: `\`${a}\\times ${b} = ${prod}\`.`,
      title: 'Integer product two-digit',
      slug: `gen-quant-e9-${slot}`,
    };
  }
  const big = 100 + (m % 50);
  const small = 10 + (mix(slot) % 25);
  const diff = big - small;
  const choices = buildNumericChoices(diff, slot, m);
  return {
    stemMd: `What is \`${big} - ${small}\`?`,
    choicesJson: choices.list,
    correctKey: choices.correctKey,
    eli5: 'Subtract the smaller value from the larger.',
    expert: `\`${big}-${small}=${diff}\`.`,
    title: 'Integer difference',
    slug: `gen-quant-e10-${slot}`,
  };
}

function quantMid(slot) {
  const m = mix(slot, 'qm');
  const kind = m % 6;
  if (kind === 0) {
    const price = 80 + (m % 8) * 10;
    const after = Math.round(price * 0.8);
    const choices = buildNumericChoices(price, slot, m);
    return {
      stemMd: `After a \`20\%\` discount, a gadget costs \`$\`${after}. What was the original price? (Assume original was a whole dollar amount.)`,
      choicesJson: choices.list.map((c) => ({ ...c, text: c.text.startsWith('$') ? c.text : `$${c.text}` })),
      correctKey: choices.correctKey,
      eli5: 'Sale price is 80% of original — divide sale price by 0.80.',
      expert: `\`0.8P=${after}\` ⇒ \`P=${after}/0.8=${price}\`.`,
      title: 'Reverse percent discount',
      slug: `gen-quant-m1-${slot}`,
    };
  }
  if (kind === 1) {
    const miles = 240 + (m % 6) * 30;
    const mph = 60;
    const hours = miles / mph;
    const choices = buildNumericChoices(hours, slot, m);
    return {
      stemMd: `A car travels \`${miles}\` miles at a constant \`${mph}\` miles per hour. How many hours does the trip take?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Time equals distance divided by speed.',
      expert: `\`t=d/r=${miles}/${mph}=${hours}\`.`,
      title: 'Time from distance',
      slug: `gen-quant-m2-${slot}`,
    };
  }
  if (kind === 2) {
    const a = 3 + (m % 5);
    const b = 4 + (mix(slot) % 5);
    const sumRoots = a + b;
    const prod = a * b;
    const choices = buildNumericChoices(sumRoots, slot, m);
    return {
      stemMd: `For real \`x\`, if \`x^2 - ${sumRoots}x + ${prod} = 0\`, what is the sum of the solutions?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'For \`x^2 + px + q = 0\`, sum of roots is \`-p\` when the leading coefficient is 1.',
      expert: 'Vieta: sum = coefficient of x with opposite sign.',
      title: 'Quadratic sum roots',
      slug: `gen-quant-m3-${slot}`,
    };
  }
  if (kind === 3) {
    const workers = 4;
    const rate = 9 + (m % 6);
    const total = workers * rate * (3 + (m % 3));
    const choices = buildNumericChoices(total, slot, m);
    return {
      stemMd: `Each of \`${workers}\` workers produces \`${rate}\` units per hour. Over \`${3 + (m % 3)}\` hours, how many units do they produce in total?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Multiply workers × rate × hours.',
      expert: 'Total = `n × r × t`.',
      title: 'Work total',
      slug: `gen-quant-m4-${slot}`,
    };
  }
  if (kind === 4) {
    const x = 2 + (m % 6);
    const y = 2 * x + 3;
    const choices = buildNumericChoices(y, slot, m);
    return {
      stemMd: `If \`y = 2x + 3\` and \`x = ${x}\`, what is \`y\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Substitute the value of `x` into the equation.',
      expert: `\`y = 2(${x})+3 = ${y}\`.`,
      title: 'Linear substitute',
      slug: `gen-quant-m5-${slot}`,
    };
  }
  const principal = 500 + (m % 5) * 100;
  const ratePct = 6;
  const years = 2;
  const simple = principal + (principal * ratePct * years) / 100;
  const choices = buildNumericChoices(simple, slot, m);
  return {
    stemMd: `\`$\`${principal} earns \`${ratePct}%\` simple annual interest for \`${years}\` years (no compounding). What is the total balance?`,
    choicesJson: choices.list.map((c) => ({ ...c, text: c.text.startsWith('$') ? c.text : `$${c.text}` })),
    correctKey: choices.correctKey,
    eli5: 'Simple interest adds `P × (r/100) × t` once per year to principal.',
    expert: `\`P + Prt/${100} = ${simple}\`.`,
    title: 'Simple interest',
    slug: `gen-quant-m6-${slot}`,
  };
}

function quantHard(slot) {
  const m = mix(slot, 'qh');
  const kind = mix(slot, 'qhk') % 9;
  if (kind === 0) {
    const a = 3 + (m % 4);
    const b = 2 + (mix(slot) % 4);
    const tank = 36;
    const rateA = tank / a;
    const rateB = tank / b;
    const combined = rateA + rateB;
    const hours = tank / combined;
    const ans = Math.round(hours * 100) / 100;
    const choices = buildFloatChoices(ans, slot);
    return {
      stemMd: `Pipe A fills a \`${tank}\`-liter tank alone in \`${a}\` hours. Pipe B fills the same tank alone in \`${b}\` hours. Working together at constant rates, how many hours to fill the tank?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Add rates (tank per hour), then divide the job (1 tank) by the combined rate.',
      expert: '`T = 1 / (1/a + 1/b)` for identical jobs.',
      title: 'Combined rates tank',
      slug: `gen-quant-h1-${slot}`,
    };
  }
  if (kind === 1) {
    const v1 = 420 + (m % 7) * 10;
    const v2 = v1 + 60;
    const d = 360;
    const t = d / (v1 + v2);
    const ans = Math.round(t * 100) / 100;
    const choices = buildFloatChoices(ans, slot);
    return {
      stemMd: `Two trains \`${d}\` miles apart head toward each other at \`${v1}\` mph and \`${v2}\` mph. In how many hours do they meet?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Relative speed is the sum when moving toward each other; time = distance / relative speed.',
      expert: `\`t = d/(v_1+v_2)\`.`,
      title: 'Closing speed',
      slug: `gen-quant-h2-${slot}`,
    };
  }
  if (kind === 2) {
    const a = 5 + (m % 8);
    const b = 8 + (mix(slot) % 10);
    const c = Math.sqrt(a * a + b * b);
    const choices = buildFloatChoices(Math.round(c * 100) / 100, slot);
    return {
      stemMd: `A right triangle has legs of length \`${a}\` and \`${b}\`. What is the length of the hypotenuse?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Pythagorean theorem: `a^2 + b^2 = c^2`.',
      expert: '`c = sqrt(a^2+b^2)`',
      title: 'Pythagorean hypotenuse',
      slug: `gen-quant-h3-${slot}`,
    };
  }
  if (kind === 3) {
    const n1 = 20 + (m % 15);
    const n2 = 30 + (mix(slot) % 20);
    const w1 = n1 + n2;
    const w2 = n1 * 3 + n2 * 2;
    const weighted = w2 / w1;
    const ans = Math.round(weighted * 100) / 100;
    const choices = buildFloatChoices(ans, slot);
    return {
      stemMd: `In a class, \`${n1}\` students averaged \`3\` points each on a quiz and \`${n2}\` students averaged \`2\` points each (same total weight per student). What was the overall average?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Overall average = total points divided by total students.',
      expert: 'Weighted mean: `(Σ n_i x_i) / Σ n_i`.',
      title: 'Weighted average',
      slug: `gen-quant-h4-${slot}`,
    };
  }
  if (kind === 4) {
    const p = 5 + (m % 6);
    const q = 7 + (mix(slot) % 5);
    const prob = p / (p + q);
    const pct = Math.round(prob * 1000) / 10;
    const choices = buildFloatChoices(pct, slot);
    return {
      stemMd: `A jar has \`${p}\` red and \`${q}\` blue marbles, identical except color. One marble is drawn at random. What is the percent chance it is red?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Probability = favorable outcomes divided by total outcomes; convert to percent.',
      expert: `\`${p}/(${p}+${q})\` as a percent.`,
      title: 'Marble probability',
      slug: `gen-quant-h5-${slot}`,
    };
  }
  if (kind === 5) {
    const k = 9 + ((m * 3) % 12);
    const thresh = (k + 3) / 2;
    const least = Number.isInteger(thresh) ? thresh + 1 : Math.ceil(thresh - 1e-9);
    const choices = buildNumericChoices(least, slot, m);
    return {
      stemMd: `For integer \`x\`, if \`2x - 3 > ${k}\`, what is the **least** integer value \`x\` can take?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Solve the inequality like `2x > k + 3`, then pick the smallest integer strictly above the boundary.',
      expert: `\`x > (k+3)/2\`, then ceiling / boundary check.`,
      title: 'Linear inequality least integer',
      slug: `gen-quant-h6-${slot}`,
    };
  }
  if (kind === 6) {
    const a = 3 + (m % 8);
    const b = 2 + (mix(slot) % 7);
    const larger = a + b;
    const choices = buildNumericChoices(larger, slot, m);
    return {
      stemMd: `If \`|x - ${a}| = ${b}\` and \`x\` is real, what is the **larger** of the two solutions for \`x\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Absolute value splits into two linear equations: `x-a = b` or `x-a = -b`.',
      expert: `Solutions \`${a + b}\` and \`${a - b}\`; pick max.`,
      title: 'Absolute value larger root',
      slug: `gen-quant-h7-${slot}`,
    };
  }
  if (kind === 7) {
    const pow = 4 + (m % 5);
    const val = 2 ** pow;
    const choices = buildNumericChoices(pow, slot, m);
    return {
      stemMd: `For integer \`k\`, if \`2^k = ${val}\`, what is \`k\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Express the right side as a power of two.',
      expert: `\`2^{${pow}} = ${val}\`.`,
      title: 'Power of two',
      slug: `gen-quant-h8-${slot}`,
    };
  }
  let S = 31 + (m % 18) * 2;
  if (S % 2 === 0) S += 1;
  const n = (S - 1) / 2;
  const choices = buildNumericChoices(n, slot, m);
  return {
    stemMd: `Two consecutive positive integers sum to \`${S}\`. What is the **smaller** integer?`,
    choicesJson: choices.list,
    correctKey: choices.correctKey,
    eli5: 'Call them `n` and `n+1`; `2n+1 = S`.',
    expert: `\`n = (S-1)/2\`.`,
    title: 'Consecutive integers sum',
    slug: `gen-quant-h9-${slot}`,
  };
}

function shuffleChoices(slot, ordered) {
  const idx = [...ordered.map((_, i) => i)];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = mix(slot + i * 17, i) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.map((j, pos) => ({ ...ordered[j], key: KEYS[pos] }));
}

function buildNumericChoices(correct, slot, m) {
  const target = Math.round(correct * 100) / 100;
  const d = Math.max(1, Math.round(Math.abs(correct) * 0.12 + 1));
  const decoys = new Set([target]);
  let k = 0;
  while (decoys.size < 5 && k < 50) {
    decoys.add(Math.round((target + d * (k + 1)) * 100) / 100);
    decoys.add(Math.round((target - d * (k + 1)) * 100) / 100);
    k += 1;
  }
  const vals = [...decoys].slice(0, 5);
  const list = shuffleChoices(
    slot + (m | 0),
    KEYS.map((key, i) => ({ key, text: String(vals[i] ?? target + i) }))
  );
  const correctKey = list.find((c) => c.text === String(target))?.key ?? 'A';
  return { list, correctKey };
}

function buildFloatChoices(correct, slot) {
  const rounded = Math.round(correct * 100) / 100;
  const opts = [
    rounded,
    Math.round((rounded + 0.15) * 100) / 100,
    Math.round((rounded - 0.12) * 100) / 100,
    Math.round((rounded + 0.3) * 100) / 100,
    Math.round((rounded - 0.25) * 100) / 100,
  ];
  const list = shuffleChoices(slot + 31, KEYS.map((key, i) => ({ key, text: String(opts[i]) })));
  const correctKey = list.find((c) => c.text === String(rounded))?.key ?? 'A';
  return { list, correctKey };
}

const Industries = [
  'a regional airline',
  'a municipal library system',
  'an online tutoring platform',
  'a boutique hotel chain',
  'a specialty coffee roaster',
];
const Policies = [
  'extend return windows for dissatisfied customers',
  'require two-factor authentication for all logins',
  'consolidate vendors to a single supplier',
  'offer subsidized childcare for employees',
];
function verbalBlock(slot, tier) {
  const m = mix(slot, 'v' + tier);
  const ind = Industries[m % Industries.length];
  const pol = Policies[m % Policies.length];
  const stem = `Editorial: ${ind.charAt(0).toUpperCase() + ind.slice(1)} should ${pol}. Comparable organizations that adopted similar measures saw measurable gains in customer retention and operational clarity; therefore, ${ind} will likely see comparable gains.`;
  let choicesJson;
  let correctLetter;
  let title;
  let slug = `gen-verb-${tier.toLowerCase()}-${slot}`;
  if (tier === PracticeTier.EASY) {
    title = 'Necessary assumption';
    choicesJson = [
      {
        key: 'A',
        text: 'The cited comparable cases are relevant to the operational context of this organization',
      },
      {
        key: 'B',
        text: 'Retention and clarity gains were caused solely by the measure in question',
      },
      { key: 'C', text: 'Every stakeholder agrees the measure is worthwhile' },
      { key: 'D', text: 'No implementation risks exist for such a policy' },
      { key: 'E', text: 'Customer retention is the only metric management tracks' },
    ];
    correctLetter = 'A';
  } else if (tier === PracticeTier.MID) {
    title = 'Weaken the argument';
    choicesJson = [
      { key: 'A', text: 'The organization has used the same brand slogan for more than a decade' },
      {
        key: 'B',
        text: 'The editorial defines “operational clarity” the same way industry analysts do',
      },
      { key: 'C', text: 'Retention improvements in comparables correlated with unrelated marketing spend' },
      { key: 'D', text: 'Comparable organizations were on average smaller than this firm' },
      { key: 'E', text: 'Customer retention is generally valued in service industries' },
    ];
    correctLetter = 'C';
  } else {
    title = 'Strengthen causal link';
    choicesJson = [
      {
        key: 'A',
        text: 'After controlling for market size, the comparables’ gains appeared only when this measure was in place',
      },
      { key: 'B', text: 'Some customers dislike policy changes' },
      { key: 'C', text: 'Retention is difficult to measure precisely' },
      { key: 'D', text: `${ind} has higher revenue than most peers` },
      { key: 'E', text: 'Operational clarity is subjective' },
    ];
    correctLetter = 'A';
  }
  const correctText = choicesJson.find((x) => x.key === correctLetter)?.text ?? '';
  const shuffled = shuffleChoices(slot, choicesJson);
  const correctKey = shuffled.find((c) => c.text === correctText)?.key ?? 'A';
  return {
    stemMd: stem,
    choicesJson: shuffled,
    correctKey,
    eli5:
      tier === PracticeTier.EASY
        ? 'Look for a bridge between the evidence (others’ outcomes) and the conclusion (this org will gain).'
        : tier === PracticeTier.MID
          ? 'You need a reason the analogy fails or the cause is not the policy.'
          : 'Pick the answer that tightens the link between the policy and the outcome.',
    expert: 'Classic GMAT critical reasoning: scope, causality, and comparability.',
    title,
    slug,
  };
}

function scBlock(slot, tier) {
  const m = mix(slot, 'sc' + tier);
  const subj = ['The collection of essays', 'The board of directors', 'A group of engineers'][m % 3];
  const stem = `Which version is grammatically correct?`;
  const fine = `${subj} is meeting tomorrow to finalize the timeline.`;
  const bad = `${subj} are meeting tomorrow to finalize the timeline.`;
  const c1 = shuffleChoices(slot, [
    { key: 'A', text: fine },
    { key: 'B', text: bad },
    { key: 'C', text: `${subj} were meeting tomorrow to finalize the timeline.` },
    { key: 'D', text: `${subj} have been meeting tomorrow to finalize the timeline.` },
    { key: 'E', text: `${subj} be meeting tomorrow to finalize the timeline.` },
  ]);
  const correctKey = c1.find((c) => c.text === fine)?.key ?? 'A';
  return {
    stemMd: stem,
    choicesJson: c1,
    correctKey,
    eli5: 'Subject–verb agreement: collective nouns and “the board” often take singular verbs.',
    expert: 'Formal subject–verb agreement on the GMAT rewards the intended standard written English.',
    title: 'Subject–verb agreement',
    slug: `gen-sc-${tier.toLowerCase()}-${slot}`,
  };
}

function verbalAssumptionHard(slot) {
  const m = mix(slot, 'vah');
  const ind = Industries[m % Industries.length];
  const pol = Policies[m % Policies.length];
  const stem = `Analyst memo: ${ind.charAt(0).toUpperCase() + ind.slice(1)} should ${pol}. Peer firms that tested comparable changes documented fewer customer-escalation tickets within a fiscal year; therefore ${ind} should expect a similar drop in escalations.`;
  const choicesJson = [
    {
      key: 'A',
      text: 'The peer firms are relevantly similar so that their outcomes are a fair baseline for this organization',
    },
    { key: 'B', text: 'Customer escalations are the sole indicator of organizational health' },
    { key: 'C', text: 'Every peer firm implemented the change on the same calendar day' },
    { key: 'D', text: 'The analyst has audited every ticket in every peer firm' },
    { key: 'E', text: 'Operational clarity cannot be measured' },
  ];
  const correctText = choicesJson[0].text;
  const shuffled = shuffleChoices(slot, choicesJson);
  const correctKey = shuffled.find((c) => c.text === correctText)?.key ?? 'A';
  return {
    stemMd: stem,
    choicesJson: shuffled,
    correctKey,
    eli5: 'Hard assumption questions still ask what must be true for the evidence about peers to apply here.',
    expert: 'Comparable-case arguments require that the analogy fits the target organization’s situation.',
    title: 'Hard necessary assumption',
    slug: `gen-verb-ah-${slot}`,
  };
}

function inferenceBlock(slot, tier) {
  const m = mix(slot, 'inf');
  const n = 40 + (m % 35);
  const stem = `All items in batch P met quality standards. Of the \`${n}\` items in batch Q, **more than half** met quality standards. Which of the following **must** be true?`;
  const choicesJson = [
    { key: 'A', text: 'At least one item in batch Q met quality standards' },
    { key: 'B', text: 'All items in batch Q met quality standards' },
    { key: 'C', text: 'No item in batch P exceeded quality standards' },
    { key: 'D', text: 'Fewer than half of the items in batch Q met quality standards' },
    { key: 'E', text: 'Batch Q contains fewer items than batch P' },
  ];
  const correctText = choicesJson[0].text;
  const shuffled = shuffleChoices(slot, choicesJson);
  const correctKey = shuffled.find((c) => c.text === correctText)?.key ?? 'A';
  return {
    stemMd: stem,
    choicesJson: shuffled,
    correctKey,
    eli5: 'If more than half passed in Q, at least one passed (for nontrivial integer counts).',
    expert: '“>50% satisfy” implies existence of at least one satisfier when the set is nonempty.',
    title: 'Must-be-true inference',
    slug: `gen-inf-${tier === PracticeTier.HARD ? 'h' : tier === PracticeTier.MID ? 'm' : 'e'}-${slot}`,
  };
}

function parallelScBlock(slot, tier) {
  const fine =
    'She trains by running hill intervals, swimming long sets, and cycling steep routes.';
  const flawed =
    'She trains by running hill intervals, to swim long sets, and cycling steep routes.';
  const c1 = shuffleChoices(slot, [
    { key: 'A', text: fine },
    { key: 'B', text: flawed },
    {
      key: 'C',
      text: 'She trains by to run hill intervals, swimming long sets, and cycling steep routes.',
    },
    { key: 'D', text: 'She trains by running hill intervals, swim long sets, and cycling steep routes.' },
    { key: 'E', text: 'She trains by running hill intervals, swimming long sets, and to cycle steep routes.' },
  ]);
  const correctKey = c1.find((c) => c.text === fine)?.key ?? 'A';
  return {
    stemMd: 'Which sentence uses **parallel structure** correctly?',
    choicesJson: c1,
    correctKey,
    eli5: 'Parallel list items should share the same grammatical form.',
    expert: 'GMAT prefers all gerunds (swimming) or all nouns — not an infinitive wedged into a gerund list.',
    title: 'Parallelism list',
    slug: `gen-par-${tier.toLowerCase()}-${slot}`,
  };
}

function pronounScBlock(slot, tier) {
  const fine =
    'Because the regional directors disagreed about the budget, the regional directors deferred new hiring until the plan was revised.';
  const c1 = shuffleChoices(slot, [
    { key: 'A', text: fine },
    {
      key: 'B',
      text: 'Because the regional directors disagreed about the budget, it deferred new hiring until the plan was revised.',
    },
    {
      key: 'C',
      text: 'Because they disagreed about the budget without naming their dissenting factions, new hiring was deferred.',
    },
    {
      key: 'D',
      text: 'Disagreeing about the budget, new hiring was deferred by them without a clear timeline.',
    },
    {
      key: 'E',
      text: 'Because the regional directors disagreed about the budget, their disagreement deferred new hiring ambiguously.',
    },
  ]);
  const correctKey = c1.find((c) => c.text === fine)?.key ?? 'A';
  return {
    stemMd: 'Which version uses **clear subject–verb and pronoun reference** in standard written English?',
    choicesJson: c1,
    correctKey,
    eli5: 'Pronouns must point unambiguously; vague “they” and faulty agreement (“it” for people) are wrong.',
    expert: 'GMAT favors explicit nouns and correct agreement; passive and dangling modifiers (D) are out.',
    title: 'Pronoun clarity',
    slug: `gen-pro-${tier.toLowerCase()}-${slot}`,
  };
}

function makeVerbal(slot, tier, skillCode) {
  if (skillCode === 'SC_SUBJECT_VERB') return scBlock(slot, tier);
  if (skillCode === 'SC_PARALLELISM') return parallelScBlock(slot, tier);
  if (skillCode === 'SC_PRONOUN') return pronounScBlock(slot, tier);
  if (skillCode === 'CR_WEAKEN') return verbalBlock(slot, PracticeTier.MID);
  if (skillCode === 'CR_STRENGTHEN') return verbalBlock(slot, PracticeTier.HARD);
  if (skillCode === 'CR_ASSUMPTION') {
    if (tier === PracticeTier.HARD) return verbalAssumptionHard(slot);
    return verbalBlock(slot, PracticeTier.EASY);
  }
  return inferenceBlock(slot, tier);
}

function diEasy(slot) {
  const m = mix(slot, 'de');
  const q1 = 40 + (m % 12);
  const q2 = q1 + 6 + (mix(slot) % 8);
  const pct = Math.round(((q2 - q1) / q1) * 1000) / 10;
  const choices = buildFloatChoices(pct, slot);
  return {
    stemMd: `| Quarter | Revenue (\\$m) |\n|:--------|---------------:|\n| Q1      | ${q1} |\n| Q2      | ${q2} |\n\nWhat is the **approximate** percent increase from Q1 to Q2?`,
    choicesJson: choices.list.map((c) => ({ ...c, text: `${c.text}%` })),
    correctKey: choices.correctKey,
    eli5: 'Percent change = new minus old, divided by old, times 100%.',
    expert: `\`(${q2}-${q1})/${q1}\` as a percent.`,
    title: 'Table percent change',
    slug: `gen-di-e-${slot}`,
  };
}

function diMid(slot) {
  const m = mix(slot, 'dm');
  const a = 12 + (m % 8);
  const b = 15 + (mix(slot) % 9);
  const ratio = Math.round((b / a) * 100) / 100;
  const choices = buildFloatChoices(ratio, slot);
  return {
    stemMd: `| Product | Units (week 1) | Units (week 2) |\n|:--------|---------------:|---------------:|\n| Alpha   | ${a}             | ${b}             |\n\nWhat is the ratio of week-2 units to week-1 units for Alpha?`,
    choicesJson: choices.list,
    correctKey: choices.correctKey,
    eli5: 'Ratio = second quantity divided by the first (watch the order asked).',
    expert: `\`${b}/${a}\`.`,
    title: 'Table ratio',
    slug: `gen-di-m-${slot}`,
  };
}

function diHard(slot) {
  const m = mix(slot, 'dh');
  const base = 50 + (m % 15) * 2;
  const p1 = 10 + (m % 8);
  const p2 = 12 + (mix(slot) % 7);
  const rev2 = Math.round(base * (1 + p1 / 100) * (1 + p2 / 100));
  const choices = buildNumericChoices(rev2, slot, m);
  return {
    stemMd: `Product line revenue was \`$\`${base}m. It rose \`${p1}%\`, then the new figure rose another \`${p2}%\`. What is the revenue after **both** increases (nearest whole \\$m)?`,
    choicesJson: choices.list.map((c) => ({ ...c, text: `$${c.text}m` })),
    correctKey: choices.correctKey,
    eli5: 'Apply successive percent increases multiplicatively, not by adding percentages naively.',
    expert: `\`${base}(1+${p1}/100)(1+${p2}/100) = ${rev2}\` (nearest whole).`,
    title: 'Successive percent',
    slug: `gen-di-h-${slot}`,
  };
}

function diGraphTrendEasy(slot) {
  const m = mix(slot, 'dge');
  const y1 = 48 + (m % 18);
  const y2 = y1 + 5 + (m % 11);
  const pct = Math.round(((y2 - y1) / y1) * 1000) / 10;
  const choices = buildFloatChoices(pct, slot);
  return {
    stemMd: `| Year | Units sold |\n|:-----|-----------:|\n| 2019 | ${y1} |\n| 2020 | ${y2} |\n\nApproximate **percent increase** 2019→2020?`,
    choicesJson: choices.list.map((c) => ({ ...c, text: `${c.text}%` })),
    correctKey: choices.correctKey,
    eli5: 'Use (new−old)/old as a percent.',
    expert: `\`(${y2}-${y1})/${y1}\`.`,
    title: 'Time series percent change',
    slug: `gen-di-gr-e-${slot}`,
  };
}

function diMultiEasy(slot) {
  const m = mix(slot, 'dxe');
  const a = 60 + (m % 40);
  const pct = 25;
  const mult = 1 + pct / 100;
  const b = Math.round(a * mult);
  const choices = buildNumericChoices(b, slot, m);
  return {
    stemMd: `**Note 1:** Store J revenue last week was \`$\`${a}k. **Note 2:** Store K revenue was \`${pct}%\` higher than Store J’s. What was Store K’s revenue (\\$k, nearest whole)?`,
    choicesJson: choices.list.map((c) => ({ ...c, text: `$${c.text}k` })),
    correctKey: choices.correctKey,
    eli5: 'Increase J by the stated percent.',
    expert: `\`${a} \\times ${mult} = ${b}\`.`,
    title: 'Two-note percent lift',
    slug: `gen-di-ms-e-${slot}`,
  };
}

function diGraphTrendMid(slot) {
  const m = mix(slot, 'dgm');
  const a = 20 + (m % 15);
  const b = 32 + (m % 18);
  const c = 44 + (mix(slot) % 12);
  const avg = Math.round(((a + b + c) / 3) * 100) / 100;
  const choices = buildFloatChoices(avg, slot);
  return {
    stemMd: `| Month | Headcount |\n|:------|----------:|\n| Jan   | ${a} |\n| Feb   | ${b} |\n| Mar   | ${c} |\n\nWhat is the **mean** headcount over the three months?`,
    choicesJson: choices.list,
    correctKey: choices.correctKey,
    eli5: 'Average = sum / count.',
    expert: `\`(${a}+${b}+${c})/3\`.`,
    title: 'Series mean from table',
    slug: `gen-di-gr-m-${slot}`,
  };
}

function diMultiMid(slot) {
  const m = mix(slot, 'dxm');
  const totalEmp = 200 + (m % 80);
  const pctTraining = 35 + (m % 15);
  const trained = Math.round((totalEmp * pctTraining) / 100);
  const choices = buildNumericChoices(trained, slot, m);
  return {
    stemMd: `**Note 1:** The division has \`${totalEmp}\` employees. **Note 2:** **${pctTraining}%** of them completed refresher training. How many employees completed refresher training (nearest whole person)?`,
    choicesJson: choices.list,
    correctKey: choices.correctKey,
    eli5: 'Multiply the total by the percent (as a decimal).',
    expert: `\`${totalEmp}\\times ${pctTraining}/100\`.`,
    title: 'Two-note percent of whole',
    slug: `gen-di-ms-m-${slot}`,
  };
}

function diGraphTrendHard(slot) {
  const m = mix(slot, 'dgh');
  const r1 = 80 + (m % 25);
  const p1 = 12 + (m % 9);
  const r2 = Math.round(r1 * (1 + p1 / 100));
  const p2 = 8 + (mix(slot) % 7);
  const r3 = Math.round(r2 * (1 + p2 / 100));
  const choices = buildNumericChoices(r3, slot, m);
  return {
    stemMd: `Revenue was \`$\`${r1}m in year T1. It grew **${p1}%** to year T2 (**$\`${r2}\`m**). It then grew **${p2}%** from T2 to T3. What is T3 revenue (\\$m, nearest whole)?`,
    choicesJson: choices.list.map((c) => ({ ...c, text: `$${c.text}m` })),
    correctKey: choices.correctKey,
    eli5: 'Apply the second percent increase to the **after-T1** level (T2).',
    expert: `\`${r2}(1+${p2}/100) = ${r3}\`.`,
    title: 'Chained percent timeline',
    slug: `gen-di-gr-h-${slot}`,
  };
}

function diMultiHard(slot) {
  const m = mix(slot, 'dxh');
  const women = 120 + (m % 60);
  const men = 90 + (mix(slot) % 50);
  const pctW = 40 + (m % 11);
  const wCert = Math.round((women * pctW) / 100);
  const menCert = Math.round(men * 0.25);
  const totalCert = wCert + menCert;
  const choices = buildNumericChoices(totalCert, slot, m);
  return {
    stemMd: `**Note 1:** Group X has \`${women}\` people; group Y has \`${men}\`. **Note 2:** **${pctW}%** of X hold a license. **Note 3:** **25%** of Y hold a license. How many people hold a license **in total** (nearest whole)?`,
    choicesJson: choices.list,
    correctKey: choices.correctKey,
    eli5: 'Compute licensed count per group, then add.',
    expert: `\`round(${women}\\cdot ${pctW}/100) + round(${men}\\cdot 0.25) = ${totalCert}\`.`,
    title: 'Multi-statement roll-up',
    slug: `gen-di-ms-h-${slot}`,
  };
}


function gmatRepetitiveQuant(tier, slot) {
  const m = mix(slot, 'grq');
  let v = mix(slot, 'grqv') % 9;
  if (tier === PracticeTier.EASY) v = [0, 1, 2, 4, 6][m % 5];
  else if (tier === PracticeTier.MID) v = [0, 1, 3, 4, 6, 7][m % 6];
  else v = [0, 3, 5, 6, 7, 8][m % 6];

  if (v === 0) {
    const a = 11 + (m % 18);
    const b = 9 + (mix(slot + 3) % 19);
    const d = 7 + (m % 5);
    const rem = (a * b) % d;
    const choices = buildNumericChoices(rem, slot, m);
    return {
      stemMd: `**GMAT-style remainder:** what is the remainder when \`${a} \\times ${b}\` is divided by \`${d}\`?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Compute the product, then divide by \`d\` and read the remainder.',
      expert: `\`(${a}\\cdot ${b}) \\bmod ${d} = ${rem}\`.`,
      title: 'GMAT remainder product',
      slug: `gmat-rpt-q-rem-${slot}`,
    };
  }
  if (v === 1) {
    const p = 2 + (m % 4);
    const q = 3 + (mix(slot + 1) % 5);
    const sum = p + q;
    const k = 6 + (m % 8);
    const total = sum * k;
    const partQ = (total * q) / sum;
    const choices = buildNumericChoices(partQ, slot, m);
    return {
      stemMd: `Ingredients A and B are mixed in the ratio \`${p}:${q}\` by weight. If \`${total}\` kilograms of the mixture are prepared, how many kilograms are ingredient B?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: `B’s share of the ratio denominator is \`${q}/(${p}+${q})\` of the whole.`,
      expert: `\`${total}\\cdot ${q}/(${p}+${q}) = ${partQ}\`.`,
      title: 'GMAT ratio part whole',
      slug: `gmat-rpt-q-ratio-${slot}`,
    };
  }
  if (v === 2) {
    const middle = 12 + (m % 25);
    const S = middle * 3;
    const choices = buildNumericChoices(middle, slot, m);
    return {
      stemMd: `**Three consecutive integers** have a sum of \`${S}\`. What is the **middle** integer?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Call them \`n-1, n, n+1\`; their sum is \`3n\`.',
      expert: `Middle equals \`S/3 = ${middle}\`.`,
      title: 'GMAT three consecutive sum',
      slug: `gmat-rpt-q-cons-${slot}`,
    };
  }
  if (v === 3) {
    const a = 5 + (m % 5);
    const b = 7 + (mix(slot + 2) % 6);
    const ans = Math.round(((a * b) / (a + b)) * 100) / 100;
    const choices = buildFloatChoices(ans, slot);
    return {
      stemMd: `**Combined work:** Team A can complete a contract in \`${a}\` days working alone; team B can complete the **same** contract in \`${b}\` days working alone. If they work together at constant combined rate, how many **days** to finish one contract?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Add reciprocals of individual times: \`1/T = 1/a + 1/b\`.',
      expert: `\`T = ab/(a+b) = ${ans}\` days.`,
      title: 'GMAT combined work simple',
      slug: `gmat-rpt-q-work-${slot}`,
    };
  }
  if (v === 4) {
    const cost = 60 + (m % 8) * 10;
    const mk = 15 + (m % 11);
    const sell = Math.round(cost * (1 + mk / 100));
    const choices = buildNumericChoices(sell, slot, m);
    return {
      stemMd: `A unit costs the store \`$\`${cost}. The shelf price reflects a \`${mk}%\` **markup on cost**. What is the shelf price?`,
      choicesJson: choices.list.map((c) => ({ ...c, text: c.text.startsWith('$') ? c.text : `$${c.text}` })),
      correctKey: choices.correctKey,
      eli5: 'Multiply cost by \`(1 + markup/100)\`.',
      expert: `\`${cost}(1+${mk}/100)=${sell}\`.`,
      title: 'GMAT cost markup sell',
      slug: `gmat-rpt-q-mkup-${slot}`,
    };
  }
  if (v === 5) {
    const v1 = 40 + (m % 5) * 5;
    const v2 = 55 + (mix(slot) % 6) * 5;
    const avg = Math.round(((2 * v1 * v2) / (v1 + v2)) * 100) / 100;
    const choices = buildFloatChoices(avg, slot);
    return {
      stemMd: `A driver travels **equal distances** at \`${v1}\` mph and at \`${v2}\` mph. What is the **average speed** for the entire trip (two legs)?`,
      choicesJson: choices.list,
      correctKey: choices.correctKey,
      eli5: 'Equal distances ⇒ average speed is the harmonic mean: \`2v_1v_2/(v_1+v_2)\`.',
      expert: `\`2\\cdot ${v1}\\cdot ${v2}/(${v1}+${v2}) = ${avg}\`.`,
      title: 'GMAT harmonic mean speed',
      slug: `gmat-rpt-q-harm-${slot}`,
    };
  }
  if (v === 6) {
    const P = 800 + (m % 12) * 50;
    const r = 6 + (m % 9);
    const bal = Math.round(P * (1 + r / 100));
    const choices = buildNumericChoices(bal, slot, m);
    return {
      stemMd: `\`$\`${P} is invested at \`${r}%\` annual interest, **compounded once** at year-end (one accrual). What is the balance after 1 year?`,
      choicesJson: choices.list.map((c) => ({ ...c, text: c.text.startsWith('$') ? c.text : `$${c.text}` })),
      correctKey: choices.correctKey,
      eli5: 'Single compounding: \`P(1+r/100)\`.',
      expert: `\`${P}(1+${r}/100)=${bal}\`.`,
      title: 'GMAT compound one year',
      slug: `gmat-rpt-q-comp-${slot}`,
    };
  }
  if (v === 7) {
    const P = 1500 + (m % 10) * 100;
    const r = 5 + (m % 8);
    const t = 2;
    const amt = P + Math.round((P * r * t) / 100);
    const choices = buildNumericChoices(amt, slot, m);
    return {
      stemMd: `\`$\`${P} earns \`${r}%\` **simple** annual interest for \`${t}\` full years. What is the total amount?`,
      choicesJson: choices.list.map((c) => ({ ...c, text: c.text.startsWith('$') ? c.text : `$${c.text}` })),
      correctKey: choices.correctKey,
      eli5: 'Simple interest: add \`P·r·t/100\` to principal.',
      expert: `\`P + Prt/100 = ${amt}\`.`,
      title: 'GMAT simple interest two year',
      slug: `gmat-rpt-q-simp2-${slot}`,
    };
  }
  const lo = -8 + (m % 5);
  const hi = lo + 5 + (mix(slot) % 7);
  const cnt = hi - lo - 1;
  const choices = buildNumericChoices(cnt, slot, m);
  return {
    stemMd: `How many **integers** \`n\` satisfy \`${lo} < n < ${hi}\`?`,
    choicesJson: choices.list,
    correctKey: choices.correctKey,
    eli5: 'Count integers strictly between the endpoints; consecutive integers ⇒ \`hi - lo - 1\` when both bounds are integers.',
    expert: `Endpoints excluded ⇒ **${cnt}** integers.`,
    title: 'GMAT strict between count',
    slug: `gmat-rpt-q-btw-${slot}`,
  };
}

const GmatCrContexts = [
  ['renewable energy credits', 'reduce reported carbon intensity'],
  ['vendor consolidation', 'lower unit procurement costs'],
  ['cross-training staff', 'shorten project cycle times'],
  ['dynamic pricing software', 'lift gross margin on peak days'],
];

function gmatCrAssumptionArchetype(slot, tier) {
  const m = mix(slot, 'gca');
  const [topic, action] = GmatCrContexts[m % GmatCrContexts.length];
  const stem = `**Memo:** To ${action}, our firm should expand investment in ${topic}. Departments at four peer firms that prioritized ${topic} reported improved benchmark scores within eighteen months; therefore our firm should expect similar benchmark gains.`;
  const choicesJson = shuffleChoices(slot, [
    {
      key: 'A',
      text: 'The peer departments are sufficiently comparable to ours that their results are a fair guide for what we should expect',
    },
    { key: 'B', text: 'Benchmark score improvements at those firms were caused solely by the expansion of that investment' },
    { key: 'C', text: 'All executives already agree that benchmark scores are the sole measure of success' },
    { key: 'D', text: 'No firm that adopted similar measures ever faced implementation setbacks' },
    { key: 'E', text: 'Benchmark scores cannot be influenced by any factor other than headcount' },
  ]);
  const correctText =
    'The peer departments are sufficiently comparable to ours that their results are a fair guide for what we should expect';
  return {
    stemMd: stem,
    choicesJson,
    correctKey: choicesJson.find((c) => c.text === correctText)?.key ?? 'A',
    eli5: 'Comparable-case arguments assume the analogy fits your situation.',
    expert: 'GMAT assumption: the evidence about peers must transfer to the conclusion about this firm.',
    title: 'GMAT assumption peers',
    slug: `gmat-rpt-v-asm-${slot}`,
  };
}

function gmatCrWeakenArchetype(slot, tier) {
  const m = mix(slot, 'gcw');
  const stem = `**Argument:** In fiscal year X, our region offered a purchase incentive on electric vehicles, and EV registrations that year rose sharply. **Conclusion:** The incentive therefore accounted for most of the increase.`;
  const choicesJson = shuffleChoices(slot + 11, [
    { key: 'A', text: 'National EV advertising spending rose modestly the same year' },
    {
      key: 'B',
      text: 'Overall vehicle demand in the region rose sharply that year because of broader macroeconomic factors unrelated to the incentive',
    },
    {
      key: 'C',
      text: 'The incentive program was administered by the same agency that tracks registrations',
    },
    { key: 'D', text: 'Some buyers filed registration paperwork online rather than in person' },
    { key: 'E', text: 'EVs generally produce lower tailpipe emissions than gasoline vehicles' },
  ]);
  const correctText =
    'Overall vehicle demand in the region rose sharply that year because of broader macroeconomic factors unrelated to the incentive';
  return {
    stemMd: stem,
    choicesJson,
    correctKey: choicesJson.find((c) => c.text === correctText)?.key ?? 'A',
    eli5: 'Weaken by showing an alternative explanation (confound) for the rise.',
    expert: 'Classic GMAT weaken: a broader demand surge breaks the claimed single-cause link.',
    title: 'GMAT weaken confound',
    slug: `gmat-rpt-v-wk-${slot}`,
  };
}

function gmatCrStrengthenArchetype(slot, tier) {
  const m = mix(slot, 'gcs');
  const stem = `**Proposal:** Adding a same-day delivery option will improve customer retention for our regional grocery chain. **Evidence:** Chains in adjacent cities that piloted same-day delivery saw higher repeat-purchase rates during the pilot window.`;
  const choicesJson = shuffleChoices(slot + 23, [
    {
      key: 'A',
      text: 'After matching store density and income levels, the pilot chains’ retention gains coincided with the delivery window and weakened when delivery was paused',
    },
    { key: 'B', text: 'Some customers dislike paying delivery fees' },
    { key: 'C', text: 'Inventory shrink is difficult to measure precisely' },
    { key: 'D', text: 'Regional grocery chains often redesign produce displays annually' },
    { key: 'E', text: 'Customer retention is a subjective concept' },
  ]);
  const correctText =
    'After matching store density and income levels, the pilot chains’ retention gains coincided with the delivery window and weakened when delivery was paused';
  return {
    stemMd: stem,
    choicesJson,
    correctKey: choicesJson.find((c) => c.text === correctText)?.key ?? 'A',
    eli5: 'Strengthen with a controlled before/after pattern tied to the intervention.',
    expert: 'Tight temporal coincidence after controls is strong support on GMAT cause-effect stems.',
    title: 'GMAT strengthen pilot',
    slug: `gmat-rpt-v-str-${slot}`,
  };
}


function gmatRepetitiveVerbal(tier, slot, skillCode) {
  const salt = slot + 8000;
  if (skillCode === 'SC_SUBJECT_VERB') {
    const core = scBlock(salt, tier);
    return { ...core, title: 'GMAT SC subject-verb', slug: `gmat-rpt-v-scsv-${slot}` };
  }
  if (skillCode === 'SC_PARALLELISM') {
    const core = parallelScBlock(salt, tier);
    return { ...core, title: 'GMAT SC parallelism', slug: `gmat-rpt-v-scpar-${slot}` };
  }
  if (skillCode === 'SC_PRONOUN') {
    const core = pronounScBlock(salt, tier);
    return { ...core, title: 'GMAT SC pronoun', slug: `gmat-rpt-v-scpro-${slot}` };
  }
  if (skillCode === 'CR_INFERENCE') {
    const core = inferenceBlock(salt, tier);
    return { ...core, title: 'GMAT CR must be true', slug: `gmat-rpt-v-inf-${slot}` };
  }
  if (skillCode === 'CR_WEAKEN') return gmatCrWeakenArchetype(slot, tier);
  if (skillCode === 'CR_STRENGTHEN') return gmatCrStrengthenArchetype(slot, tier);
  return gmatCrAssumptionArchetype(slot, tier);
}

function gmatRepetitiveDi(tier, slot, skillCode) {
  const m = mix(slot, 'grd');
  if (skillCode === 'GRAPH_TRENDS') {
    const q1 = 120 + (m % 18) * 8;
    const q2 = Math.round(q1 * (1.08 + (mix(slot) % 5) * 0.02));
    const delta = Math.round(((q2 - q1) / q1) * 1000) / 10;
    const choices = buildFloatChoices(delta, slot);
    return {
      stemMd: `| Quarter | Online orders |\n|:--------:|---------------:|\n| Q1      | ${q1} |\n| Q2      | ${q2} |\n\n**GMAT recurring pattern:** approximate **percent increase** from Q1 to Q2.`,
      choicesJson: choices.list.map((c) => ({ ...c, text: `${c.text}%` })),
      correctKey: choices.correctKey,
      eli5: 'Percent change = \`(new-old)/old × 100%\`.',
      expert: `\`(${q2}-${q1})/${q1}\` as a percent.`,
      title: 'GMAT DI orders percent lift',
      slug: `gmat-rpt-d-ord-${slot}`,
    };
  }
  if (skillCode === 'MULTI_SOURCE_SIMPLE') {
    const spend = 48000 + (m % 9) * 2400;
    const units = 1600 + (m % 7) * 120;
    const cpu = Math.round((spend / units) * 100) / 100;
    const choices = buildFloatChoices(cpu, slot);
    return {
      stemMd: `**Note 1:** Total production spending was \`$\`${spend}. **Note 2:** **${units}** finished units were completed. **Question:** what was **average cost per finished unit**?`,
      choicesJson: choices.list.map((c) => ({ ...c, text: c.text.startsWith('$') ? c.text : `$${c.text}` })),
      correctKey: choices.correctKey,
      eli5: 'Divide total spend by units completed.',
      expert: `\`${spend}/${units} = ${cpu}\`.`,
      title: 'GMAT multi note unit cost',
      slug: `gmat-rpt-d-unit-${slot}`,
    };
  }
  const visits = 3000 + (m % 12) * 150;
  const rateTenths = 45 + (mix(slot + 5) % 50);
  const rate = rateTenths / 10;
  const signups = Math.round((visits * rate) / 100);
  const choices = buildNumericChoices(signups, slot, m);
  return {
    stemMd: `| Metric | Value |\n|:-------|------:|\n| Visitor sessions | ${visits} |\n| Trial sign-up rate | ${rate}% |\n\nIf the rate applies uniformly, how many **trial sign-ups** should you expect (nearest whole person)?`,
    choicesJson: choices.list,
    correctKey: choices.correctKey,
    eli5: 'Multiply sessions by the percent expressed as a decimal.',
    expert: `\`${visits}\\cdot ${rate}/100 \\approx ${signups}\`.`,
    title: 'GMAT funnel conversion',
    slug: `gmat-rpt-d-fun-${slot}`,
  };
}

function makeQuant(tier, slot) {
  if (tier === PracticeTier.EASY) return quantEasy(slot);
  if (tier === PracticeTier.MID) return quantMid(slot);
  return quantHard(slot);
}

function makeDi(tier, slot, skillCode) {
  if (skillCode === 'GRAPH_TRENDS') {
    if (tier === PracticeTier.EASY) return diGraphTrendEasy(slot);
    if (tier === PracticeTier.MID) return diGraphTrendMid(slot);
    return diGraphTrendHard(slot);
  }
  if (skillCode === 'MULTI_SOURCE_SIMPLE') {
    if (tier === PracticeTier.EASY) return diMultiEasy(slot);
    if (tier === PracticeTier.MID) return diMultiMid(slot);
    return diMultiHard(slot);
  }
  if (tier === PracticeTier.EASY) return diEasy(slot);
  if (tier === PracticeTier.MID) return diMid(slot);
  return diHard(slot);
}

function buildRow(section, tier, indexInTier) {
  const slot = indexInTier + (tier === PracticeTier.EASY ? 0 : tier === PracticeTier.MID ? 1000 : 2000);
  const skillCode = skillCodeForSlot(section, tier, indexInTier);
  const useGmatRepetitiveFamily =
    indexInTier % 5 === 0 ||
    (section === Section.VERBAL && indexInTier === 97);
  let core;
  if (section === Section.QUANT) {
    core = useGmatRepetitiveFamily ? gmatRepetitiveQuant(tier, slot) : makeQuant(tier, slot);
  } else if (section === Section.VERBAL) {
    core = useGmatRepetitiveFamily
      ? gmatRepetitiveVerbal(tier, slot, skillCode)
      : makeVerbal(slot, tier, skillCode);
  } else {
    core = useGmatRepetitiveFamily ? gmatRepetitiveDi(tier, slot, skillCode) : makeDi(tier, slot, skillCode);
  }

  const pad = String(indexInTier + 1).padStart(4, '0');
  const secShort = section === Section.QUANT ? 'Q' : section === Section.VERBAL ? 'V' : 'D';
  const tShort = tier === PracticeTier.EASY ? 'E' : tier === PracticeTier.MID ? 'M' : 'H';
  const externalKey = `pb-${secShort}-${tShort}-${pad}-${mix(indexInTier, section + tier) % 10000}`;

  return {
    externalKey,
    section,
    practiceTier: tier,
    skillCode,
    slug: core.slug,
    title: core.title,
    difficulty: irtDifficulty(tier, slot),
    discrimination: tier === PracticeTier.HARD ? 1.15 : tier === PracticeTier.MID ? 1.05 : 0.95,
    guessing: 0.2,
    timeTargetSec: section === Section.VERBAL ? 110 : 90,
    stemMd: core.stemMd,
    choicesJson: core.choicesJson,
    correctKey: core.correctKey,
    eli5: core.eli5,
    expert: core.expert,
  };
}


function stripNumLabel(raw) {
  let t = String(raw ?? '').trim();
  if (t.endsWith('%')) t = t.slice(0, -1).trim();
  t = t.replace(/^\$/g, '').replace(/k$/i, '').replace(/m$/i, '').trim();
  return t;
}

function numClose(a, b, tol = 0.051) {
  const x = parseFloat(a);
  const y = parseFloat(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return String(a) === String(b);
  return Math.abs(x - y) <= tol;
}


function expectedAnswerFromRow(row) {
  const s = row.stemMd;
  switch (row.title) {
    case 'Linear isolate x': {
      const m = /If `(\d+)x = (\d+)`/.exec(s);
      if (!m) return null;
      return String(parseInt(m[2], 10) / parseInt(m[1], 10));
    }
    case 'Percent of a number': {
      const m = /What is `(\d+)%` of `(\d+)`\?/.exec(s);
      if (!m) return null;
      return String(Math.round((parseInt(m[1], 10) * parseInt(m[2], 10)) / 100));
    }
    case 'Rectangle perimeter': {
      const m = /length `(\d+)` and width `(\d+)`/.exec(s);
      if (!m) return null;
      const L = parseInt(m[1], 10);
      const W = parseInt(m[2], 10);
      return String(2 * (L + W));
    }
    case 'Mean of two': {
      const m = /mean\) of `(\d+)` and `(\d+)`\?/.exec(s);
      if (!m) return null;
      return String((parseInt(m[1], 10) + parseInt(m[2], 10)) / 2);
    }
    case 'Half of whole': {
      const m = /of `(\d+)`\?/.exec(s);
      if (!m) return null;
      const w = parseInt(m[1], 10);
      return String(w / 2);
    }
    case 'Integer times table': {
      const m = /`(\d+)` times `(\d+)`/.exec(s);
      if (!m) return null;
      return String(parseInt(m[1], 10) * parseInt(m[2], 10));
    }
    case 'Additive change': {
      const m = /starts at `(\d+)\^/.exec(s);
      const m2 = /rises by `(\d+)\^/.exec(s);
      if (!m || !m2) return null;
      return String(parseInt(m[1], 10) + parseInt(m2[1], 10));
    }
    case 'Integer square': {
      const m = /What is `(\d+)\^2`\?/.exec(s);
      if (!m) return null;
      const n = parseInt(m[1], 10);
      return String(n * n);
    }
    case 'Integer product two-digit': {
      const m = /What is `(\d+) \\times (\d+)`\?/.exec(s);
      if (!m) return null;
      return String(parseInt(m[1], 10) * parseInt(m[2], 10));
    }
    case 'Integer difference': {
      const m = /What is `(\d+) - (\d+)`\?/.exec(s);
      if (!m) return null;
      return String(parseInt(m[1], 10) - parseInt(m[2], 10));
    }
    case 'Reverse percent discount': {
      const m = /costs `\$(\d+)`/.exec(s);
      if (!m) return null;
      return String(Math.round(parseInt(m[1], 10) / 0.8));
    }
    case 'Time from distance': {
      const m = /travels `(\d+)` miles/.exec(s);
      if (!m) return null;
      return String(parseInt(m[1], 10) / 60);
    }
    case 'Quadratic sum roots': {
      const m = /x\^2 - (\d+)x \+ (\d+) = 0/.exec(s);
      if (!m) return null;
      return String(parseInt(m[1], 10));
    }
    case 'Work total': {
      const m = /Each of `(\d+)` workers produces `(\d+)` units per hour. Over `(\d+)` hours/.exec(
        s
      );
      if (!m) return null;
      return String(parseInt(m[1], 10) * parseInt(m[2], 10) * parseInt(m[3], 10));
    }
    case 'Linear substitute': {
      const m = /x = (\d+)/.exec(s);
      if (!m) return null;
      const x = parseInt(m[1], 10);
      return String(2 * x + 3);
    }
    case 'Simple interest': {
      const m = /`\$(\d+)` earns `(\d+)%` simple annual interest for `(\d+)` years/.exec(s);
      if (!m) return null;
      const P = parseInt(m[1], 10);
      const r = parseInt(m[2], 10);
      const t = parseInt(m[3], 10);
      return String(P + (P * r * t) / 100);
    }
    case 'Combined rates tank': {
      const m = /tank alone in `(\d+)` hours. Pipe B fills the same tank alone in `(\d+)` hours/.exec(
        s
      );
      if (!m) return null;
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      const tank = 36;
      const hours = tank / (tank / a + tank / b);
      return String(Math.round(hours * 100) / 100);
    }
    case 'Closing speed': {
      const m = /head toward each other at `(\d+)` mph and `(\d+)` mph/.exec(s);
      if (!m) return null;
      const v1 = parseInt(m[1], 10);
      const v2 = parseInt(m[2], 10);
      const t = 360 / (v1 + v2);
      return String(Math.round(t * 100) / 100);
    }
    case 'Pythagorean hypotenuse': {
      const m = /length `(\d+)` and `(\d+)`/.exec(s);
      if (!m) return null;
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      return String(Math.round(Math.sqrt(a * a + b * b) * 100) / 100);
    }
    case 'Weighted average': {
      const m = /`(\d+)` students averaged `3` points.*?`(\d+)` students averaged `2` points/.exec(s);
      if (!m) return null;
      const n1 = parseInt(m[1], 10);
      const n2 = parseInt(m[2], 10);
      const w = (n1 * 3 + n2 * 2) / (n1 + n2);
      return String(Math.round(w * 100) / 100);
    }
    case 'Marble probability': {
      const m = /`(\d+)` red and `(\d+)` blue/.exec(s);
      if (!m) return null;
      const p = parseInt(m[1], 10);
      const q = parseInt(m[2], 10);
      return String(Math.round((p / (p + q)) * 1000) / 10);
    }
    case 'Linear inequality least integer': {
      const m = /2x - 3 > (\d+)/.exec(s);
      if (!m) return null;
      const k = parseInt(m[1], 10);
      const thresh = (k + 3) / 2;
      return String(Number.isInteger(thresh) ? thresh + 1 : Math.ceil(thresh - 1e-9));
    }
    case 'Absolute value larger root': {
      const m = /\|x - (\d+)\| = (\d+)/.exec(s);
      if (!m) return null;
      return String(parseInt(m[1], 10) + parseInt(m[2], 10));
    }
    case 'Power of two': {
      const m = /2\^k = (\d+)/.exec(s);
      if (!m) return null;
      const v = parseInt(m[1], 10);
      return String(Math.round(Math.log2(v)));
    }
    case 'Consecutive integers sum': {
      const m = /sum to `(\d+)`/.exec(s);
      if (!m) return null;
      const S = parseInt(m[1], 10);
      return String((S - 1) / 2);
    }
    case 'Table percent change':
    case 'Time series percent change': {
      const m = /\| Q1\s+\| (\d+)/.exec(s);
      const m2 = /\| Q2\s+\| (\d+)/.exec(s);
      if (m && m2) {
        const q1 = parseInt(m[1], 10);
        const q2 = parseInt(m2[1], 10);
        return String(Math.round(((q2 - q1) / q1) * 1000) / 10);
      }
      const y1 = /\| 2019 \| (\d+)/.exec(s);
      const y2 = /\| 2020 \| (\d+)/.exec(s);
      if (y1 && y2) {
        const a = parseInt(y1[1], 10);
        const b = parseInt(y2[1], 10);
        return String(Math.round(((b - a) / a) * 1000) / 10);
      }
      return null;
    }
    case 'Table ratio': {
      const m = /Alpha\s+\|\s+(\d+)\s+\|\s+(\d+)/.exec(s);
      if (!m) return null;
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      return String(Math.round((b / a) * 100) / 100);
    }
    case 'Successive percent': {
      const m = /revenue was `\$(\d+)`m.*?rose `(\d+)%`.*?another `(\d+)%`/.exec(s);
      if (!m) return null;
      const base = parseInt(m[1], 10);
      const p1 = parseInt(m[2], 10);
      const p2 = parseInt(m[3], 10);
      return String(Math.round(base * (1 + p1 / 100) * (1 + p2 / 100)));
    }
    case 'Two-note percent lift': {
      const m = /Store J revenue.*?`\$(\d+)k/.exec(s);
      if (!m) return null;
      const a = parseInt(m[1], 10);
      return String(Math.round(a * 1.25));
    }
    case 'Series mean from table': {
      const m = /Jan\s+\|\s+(\d+)/.exec(s);
      const m2 = /Feb\s+\|\s+(\d+)/.exec(s);
      const m3 = /Mar\s+\|\s+(\d+)/.exec(s);
      if (!m || !m2 || !m3) return null;
      const av =
        (parseInt(m[1], 10) + parseInt(m2[1], 10) + parseInt(m3[1], 10)) / 3;
      return String(Math.round(av * 100) / 100);
    }
    case 'Two-note percent of whole': {
      const m = /has `(\d+)` employees.*?`(\d+)%` of them/.exec(s);
      if (!m) return null;
      return String(Math.round((parseInt(m[1], 10) * parseInt(m[2], 10)) / 100));
    }
    case 'Chained percent timeline': {
      const m = /`\$(\d+)`m in year T1.*?grew \*\*(\d+)%\*\* to year T2 \(\*\*`\$(\d+)`m\*\*.+grew \*\*(\d+)%\*\* from T2/m;
      const m2 = s.match(
        /`\$(\d+)`m in year T1\. It grew \*\*(\d+)%\*\* to year T2 \(\*\*`\$(\d+)`m\*\*\)\. It then grew \*\*(\d+)%\*\* from T2 to T3/
      );
      if (!m2) return null;
      const r2 = parseInt(m2[3], 10);
      const p2 = parseInt(m2[4], 10);
      return String(Math.round(r2 * (1 + p2 / 100)));
    }
    case 'Multi-statement roll-up': {
      const m2 = /Group X has `(\d+)` people; group Y has `(\d+)`/.exec(s);
      const m3 = /\*\*(\d+)%\*\* of X hold/.exec(s);
      if (!m2 || !m3) return null;
      const women = parseInt(m2[1], 10);
      const men = parseInt(m2[2], 10);
      const pctW = parseInt(m3[1], 10);
      return String(Math.round((women * pctW) / 100) + Math.round(men * 0.25));
    }
    case 'GMAT remainder product': {
      const m = /when `(\d+) \\times (\d+)` is divided by `(\d+)`/.exec(s);
      if (!m) return null;
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      const d = parseInt(m[3], 10);
      return String((a * b) % d);
    }
    case 'GMAT ratio part whole': {
      const m1 = /ratio `(\d+):(\d+)` by weight/.exec(s);
      const m2 = /If `(\d+)` kilograms/.exec(s);
      if (!m1 || !m2) return null;
      const p = parseInt(m1[1], 10);
      const q = parseInt(m1[2], 10);
      const total = parseInt(m2[1], 10);
      return String((total * q) / (p + q));
    }
    case 'GMAT three consecutive sum': {
      const m = /have a sum of `(\d+)`/.exec(s);
      if (!m) return null;
      const S = parseInt(m[1], 10);
      return String(S / 3);
    }
    case 'GMAT combined work simple': {
      const m2 =
        /in `(\d+)` days working alone; team B can complete the \*\*same\*\* contract in `(\d+)` days/.exec(
          s
        );
      if (!m2) return null;
      const a = parseInt(m2[1], 10);
      const b = parseInt(m2[2], 10);
      return String(Math.round(((a * b) / (a + b)) * 100) / 100);
    }
    case 'GMAT cost markup sell': {
      const m1 = /costs the store `\$(\d+)`/.exec(s);
      const m2 = /`(\d+)%`\s*\*\*markup on cost\*\*/.exec(s);
      if (!m1 || !m2) return null;
      const cost = parseInt(m1[1], 10);
      const mk = parseInt(m2[1], 10);
      return String(Math.round(cost * (1 + mk / 100)));
    }
    case 'GMAT harmonic mean speed': {
      const m = /at `(\d+)` mph and at `(\d+)` mph/.exec(s);
      if (!m) return null;
      const v1 = parseInt(m[1], 10);
      const v2 = parseInt(m[2], 10);
      return String(Math.round(((2 * v1 * v2) / (v1 + v2)) * 100) / 100);
    }
    case 'GMAT compound one year': {
      const m = /`\$(\d+)` is invested at `(\d+)%` annual interest/.exec(s);
      if (!m) return null;
      const P = parseInt(m[1], 10);
      const r = parseInt(m[2], 10);
      return String(Math.round(P * (1 + r / 100)));
    }
    case 'GMAT simple interest two year': {
      const m = /`\$(\d+)` earns `(\d+)%` \*\*simple\*\* annual interest for `(\d+)` full years/.exec(s);
      if (!m) return null;
      const P = parseInt(m[1], 10);
      const r = parseInt(m[2], 10);
      const t = parseInt(m[3], 10);
      return String(P + Math.round((P * r * t) / 100));
    }
    case 'GMAT strict between count': {
      const m = /`(-?\d+) < n < (-?\d+)`/.exec(s);
      if (!m) return null;
      const lo = parseInt(m[1], 10);
      const hi = parseInt(m[2], 10);
      return String(hi - lo - 1);
    }
    case 'GMAT DI orders percent lift': {
      const mq1 = /\| Q1\s+\|\s+(\d+)/.exec(s);
      const mq2 = /\| Q2\s+\|\s+(\d+)/.exec(s);
      if (!mq1 || !mq2) return null;
      const q1 = parseInt(mq1[1], 10);
      const q2 = parseInt(mq2[1], 10);
      return String(Math.round(((q2 - q1) / q1) * 1000) / 10);
    }
    case 'GMAT multi note unit cost': {
      const m1 = /spending was `\$(\d+)`/.exec(s);
      const m2 = /\*\*(\d+)\*\* finished units/.exec(s);
      if (!m1 || !m2) return null;
      const spend = parseInt(m1[1], 10);
      const units = parseInt(m2[1], 10);
      return String(Math.round((spend / units) * 100) / 100);
    }
    case 'GMAT funnel conversion': {
      const mv = /\| Visitor sessions \| (\d+) \|/.exec(s);
      const mr = /\| Trial sign-up rate \| ([\d.]+)% \|/.exec(s);
      if (!mv || !mr) return null;
      const visits = parseInt(mv[1], 10);
      const rate = parseFloat(mr[1]);
      return String(Math.round((visits * rate) / 100));
    }
    default:
      return null;
  }
}


function verifyNumericBank(rows) {
  const errors = [];
  const skipped = new Set();
  for (const row of rows) {
    const c = row.choicesJson.find((x) => x.key === row.correctKey);
    if (!c) {
      errors.push({ id: row.externalKey, msg: 'correctKey not found in choicesJson' });
      continue;
    }
    if (row.section === Section.VERBAL) continue;
    const exp = expectedAnswerFromRow(row);
    if (exp == null) {
      skipped.add(row.title);
      continue;
    }
    const got = stripNumLabel(c.text);
    if (
      row.title === 'Table percent change' ||
      row.title === 'Time series percent change' ||
      row.title === 'Marble probability' ||
      row.title === 'GMAT DI orders percent lift'
    ) {
      if (!numClose(got, stripNumLabel(exp + (c.text.includes('%') ? '%' : '')), 0.11)) {
        if (!numClose(got, exp)) errors.push({ id: row.externalKey, title: row.title, exp, got: c.text });
      }
    } else if (!numClose(got, stripNumLabel(exp))) {
      errors.push({ id: row.externalKey, title: row.title, exp, got: c.text });
    }
  }
  return { errors, skippedTitles: skipped };
}


function assertHardTierCoversAllSkills(rows, minEach = 14) {
  const problems = [];
  for (const section of SECTIONS) {
    const skillList =
      section === Section.QUANT
        ? QUANT_SKILLS
        : section === Section.VERBAL
          ? VERBAL_SKILLS
          : DI_SKILLS;
    const hardRows = rows.filter(
      (r) => r.section === section && r.practiceTier === PracticeTier.HARD
    );
    const counts = Object.fromEntries(skillList.map((sk) => [sk, 0]));
    for (const r of hardRows) {
      if (counts[r.skillCode] != null) counts[r.skillCode] += 1;
    }
    for (const sk of skillList) {
      if (counts[sk] < minEach) problems.push({ section, skill: sk, count: counts[sk], minEach });
    }
  }
  return problems;
}

const TIERS = [PracticeTier.EASY, PracticeTier.MID, PracticeTier.HARD];
const SECTIONS = [Section.QUANT, Section.VERBAL, Section.DATA_INSIGHTS];

function buildBankRows() {
  const rows = [];
  for (const section of SECTIONS) {
    for (const tier of TIERS) {
      for (let k = 0; k < PER_TIER; k++) {
        rows.push(buildRow(section, tier, k));
      }
    }
  }
  return rows;
}

module.exports = {
  buildBankRows,
  verifyNumericBank,
  expectedAnswerFromRow,
  assertHardTierCoversAllSkills,
  QUANT_SKILLS,
  VERBAL_SKILLS,
  DI_SKILLS,
  PER_TIER,
};
