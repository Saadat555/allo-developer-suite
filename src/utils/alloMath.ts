import { GrantProject } from '../types';

/**
 * Calculates Quadratic Funding match for a list of projects.
 * Formula:
 * raw_match(p) = (sum(sqrt(c_i)))^2 - sum(c_i)
 * matched_amount(p) = (raw_match(p) / sum(raw_match(all))) * matchingPoolSize
 */
export function calculateQuadraticFunding(
  projects: GrantProject[],
  matchingPoolSize: number,
  passportThreshold: number = 20,
  enforcePassport: boolean = true
): GrantProject[] {
  // Step 1: Filter donations by passport score if enforced
  const projectStats = projects.map((p) => {
    let validDonations: number[] = [];
    p.donations.forEach((amount, idx) => {
      const score = p.passportScores[idx] !== undefined ? p.passportScores[idx] : 25;
      if (!enforcePassport || score >= passportThreshold) {
        validDonations.push(amount);
      }
    });

    const directTotal = validDonations.reduce((sum, d) => sum + d, 0);
    const sumSqrt = validDonations.reduce((sum, d) => sum + Math.sqrt(d), 0);
    const rawMatch = Math.max(0, Math.pow(sumSqrt, 2) - directTotal);

    return {
      project: p,
      directTotal,
      rawMatch,
    };
  });

  const totalRawMatch = projectStats.reduce((sum, stat) => sum + stat.rawMatch, 0);

  return projectStats.map(({ project, directTotal, rawMatch }) => {
    const matchedAmount =
      totalRawMatch > 0 ? (rawMatch / totalRawMatch) * matchingPoolSize : 0;
    const roundedMatch = Math.round(matchedAmount * 100) / 100;
    const roundedDirect = Math.round(directTotal * 100) / 100;

    return {
      ...project,
      directTotal: roundedDirect,
      matchedAmount: roundedMatch,
      totalWithMatch: Math.round((roundedDirect + roundedMatch) * 100) / 100,
    };
  });
}

/**
 * Generates sample initial projects for GG24 simulation
 */
export const INITIAL_PROJECTS: GrantProject[] = [
  {
    id: 'proj-1',
    name: 'Allo Protocol Developer Suite',
    tagline: 'Interactive visual strategy simulator & SDK devtools by @Saadat555',
    recipientAddress: '0xd1c82c9D7e318162518B0838158B8095805e5791',
    donations: [25, 10, 15, 50, 5, 20, 100, 15, 30, 25],
    passportScores: [32, 28, 45, 52, 22, 38, 41, 26, 35, 29],
    directTotal: 295,
    matchedAmount: 0,
    totalWithMatch: 0,
  },
  {
    id: 'proj-2',
    name: 'EVM Zero-Knowledge Audit Linter',
    tagline: 'Automated ZK bytecode validation & circuit verifier toolkit',
    recipientAddress: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    donations: [500], // 1 whale donation ($500)
    passportScores: [55],
    directTotal: 500,
    matchedAmount: 0,
    totalWithMatch: 0,
  },
  {
    id: 'proj-3',
    name: 'Decentralized RPC Health Monitor',
    tagline: 'Multi-chain public RPC latency indexer & failover router',
    recipientAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    donations: [10, 10, 10, 10, 10, 10, 10], // 7 small donors ($70)
    passportScores: [24, 30, 18, 35, 42, 21, 27],
    directTotal: 70,
    matchedAmount: 0,
    totalWithMatch: 0,
  },
];
