// Cut Sequence Optimization for safer and more efficient cutting
import { StockUsage, Placement, MaterialType, Part } from './types';

export interface CutSequenceStep {
  id: string;
  stepNumber: number;
  cutType: 'rip' | 'crosscut' | 'initial-breakdown' | 'final-trim';
  description: string;
  safetyNotes: string[];
  placements: Placement[];
  cutLine?: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    direction: 'horizontal' | 'vertical';
  };
  priority: 'high' | 'medium' | 'low';
  toolSuggestion?: string;
}

export interface OptimizedCutSequence {
  stockUsageIndex: number;
  sheetId: string;
  steps: CutSequenceStep[];
  totalSteps: number;
  estimatedTime: number; // in minutes
  safetyScore: number; // 1-10 scale
  efficiencyScore: number; // 1-10 scale
  recommendations: string[];
}

/**
 * Generates an optimized cutting sequence for safety and efficiency
 */
export function generateOptimalCutSequence(
  stockUsage: StockUsage[],
  availableStocks: any[],
  sortedParts: Part[]
): OptimizedCutSequence[] {
  const sequences: OptimizedCutSequence[] = [];

  stockUsage.forEach((usage, usageIndex) => {
    const stock = availableStocks[usage.stockIndex];
    
    // Only generate sequences for sheet materials (dimensional lumber is simpler)
    if (stock.materialType === MaterialType.Sheet) {
      const sequence = generateSheetCutSequence(usage, usageIndex, stock, sortedParts);
      sequences.push(sequence);
    } else {
      const sequence = generateDimensionalCutSequence(usage, usageIndex, stock, sortedParts);
      sequences.push(sequence);
    }
  });

  return sequences;
}

/**
 * Generate cutting sequence for sheet materials
 */
function generateSheetCutSequence(
  usage: StockUsage,
  usageIndex: number,
  stock: any,
  sortedParts: Part[]
): OptimizedCutSequence {
  const steps: CutSequenceStep[] = [];
  let stepNumber = 1;

  // Safety and efficiency principles for sheet cutting:
  // 1. Make longest cuts first (less material to handle)
  // 2. Make rip cuts before crosscuts when possible
  // 3. Group similar cuts together
  // 4. Consider grain direction for tear-out prevention
  // 5. Leave final trimming cuts for last

  // Step 1: Initial breakdown - create manageable sections
  if (usage.placements.length > 4) {
    steps.push({
      id: `${usage.sheetId}-breakdown`,
      stepNumber: stepNumber++,
      cutType: 'initial-breakdown',
      description: 'Break down the full sheet into manageable sections',
      safetyNotes: [
        'Use two people for large sheets (over 1200mm)',
        'Support both sides of the cut line',
        'Make sure the offcuts won\'t fall and cause injury'
      ],
      placements: [],
      priority: 'high',
      toolSuggestion: 'Table saw or track saw for straight cuts'
    });
  }

  // Analyze placements to group cuts
  const groupedPlacements = groupPlacementsByCutLines(usage.placements, sortedParts);
  
  // Step 2: Make primary rip cuts (along the grain if applicable)
  const ripCuts = identifyRipCuts(groupedPlacements, stock);
  ripCuts.forEach((cutGroup, index) => {
    steps.push({
      id: `${usage.sheetId}-rip-${index}`,
      stepNumber: stepNumber++,
      cutType: 'rip',
      description: `Rip cut to separate pieces: ${cutGroup.placements.map((p: any) => p.name || p.partId).join(', ')}`,
      safetyNotes: [
        'Use a rip fence for accuracy',
        'Feed material steadily through the blade',
        'Use push sticks for narrow pieces'
      ],
      placements: cutGroup.placements,
      cutLine: cutGroup.cutLine,
      priority: 'high',
      toolSuggestion: 'Table saw with rip fence'
    });
  });

  // Step 3: Make crosscuts
  const crosscuts = identifyCrossCuts(groupedPlacements, stock);
  crosscuts.forEach((cutGroup, index) => {
    steps.push({
      id: `${usage.sheetId}-crosscut-${index}`,
      stepNumber: stepNumber++,
      cutType: 'crosscut',
      description: `Crosscut to length: ${cutGroup.placements.map((p: any) => p.name || p.partId).join(', ')}`,
      safetyNotes: [
        'Use a crosscut sled or miter gauge',
        'Support long pieces with auxiliary fence',
        'Cut with a fine-tooth blade to reduce tear-out'
      ],
      placements: cutGroup.placements,
      cutLine: cutGroup.cutLine,
      priority: 'medium',
      toolSuggestion: 'Table saw with crosscut sled or miter saw'
    });
  });

  // Step 4: Final trimming cuts
  if (usage.placements.length > 2) {
    steps.push({
      id: `${usage.sheetId}-trim`,
      stepNumber: stepNumber++,
      cutType: 'final-trim',
      description: 'Final trimming and sizing of individual pieces',
      safetyNotes: [
        'Check each piece for final dimensions',
        'Sand or route edges as needed',
        'Label pieces as you finish them'
      ],
      placements: usage.placements,
      priority: 'low',
      toolSuggestion: 'Hand tools, router, or fine-adjustment on table saw'
    });
  }

  const safetyScore = calculateSafetyScore(steps, usage.placements.length);
  const efficiencyScore = calculateEfficiencyScore(steps, usage.wasteArea, stock);
  
  return {
    stockUsageIndex: usageIndex,
    sheetId: usage.sheetId,
    steps,
    totalSteps: steps.length,
    estimatedTime: estimateCuttingTime(steps, stock.materialType),
    safetyScore,
    efficiencyScore,
    recommendations: generateRecommendations(steps, stock, usage)
  };
}

/**
 * Generate cutting sequence for dimensional lumber
 */
function generateDimensionalCutSequence(
  usage: StockUsage,
  usageIndex: number,
  stock: any,
  sortedParts: Part[]
): OptimizedCutSequence {
  const steps: CutSequenceStep[] = [];
  let stepNumber = 1;

  // For dimensional lumber, it's primarily crosscuts
  // Sort placements by position (x-coordinate) for efficient cutting
  const sortedPlacements = [...usage.placements].sort((a, b) => a.x - b.x);

  // Group consecutive cuts that can be made efficiently
  const cutGroups = groupConsecutiveCuts(sortedPlacements, sortedParts);

  cutGroups.forEach((group, index) => {
    steps.push({
      id: `${usage.sheetId}-crosscut-${index}`,
      stepNumber: stepNumber++,
      cutType: 'crosscut',
      description: `Cut pieces: ${group.map(p => p.name || p.partId).join(', ')}`,
      safetyNotes: [
        'Use a stop block for consistent lengths',
        'Support the off-cut to prevent binding',
        'Measure twice, cut once'
      ],
      placements: group,
      priority: 'medium',
      toolSuggestion: 'Miter saw or table saw with crosscut sled'
    });
  });

  const safetyScore = calculateSafetyScore(steps, usage.placements.length);
  const efficiencyScore = calculateEfficiencyScore(steps, usage.wasteArea, stock);

  return {
    stockUsageIndex: usageIndex,
    sheetId: usage.sheetId,
    steps,
    totalSteps: steps.length,
    estimatedTime: estimateCuttingTime(steps, stock.materialType),
    safetyScore,
    efficiencyScore,
    recommendations: generateRecommendations(steps, stock, usage)
  };
}

/**
 * Group placements by potential cut lines
 */
function groupPlacementsByCutLines(placements: Placement[], sortedParts: Part[]) {
  // This is a simplified grouping - in practice, this would analyze
  // the actual layout to find optimal cutting paths
  return placements.map(placement => ({
    placement,
    part: sortedParts[parseInt(placement.partId.split('-')[1])]
  }));
}

/**
 * Identify rip cuts (typically along the grain)
 */
function identifyRipCuts(groupedPlacements: any[], stock: any) {
  const ripCuts: any[] = [];
  
  // Group placements that can be made with vertical cuts
  const verticalGroups = groupPlacementsByVerticalAlignment(groupedPlacements);
  
  verticalGroups.forEach((group, index) => {
    if (group.length > 1) {
      ripCuts.push({
        placements: group.map(g => g.placement),
        cutLine: {
          start: { x: findOptimalCutLine(group, 'vertical'), y: 0 },
          end: { x: findOptimalCutLine(group, 'vertical'), y: stock.width },
          direction: 'vertical' as const
        }
      });
    }
  });

  return ripCuts;
}

/**
 * Identify crosscuts
 */
function identifyCrossCuts(groupedPlacements: any[], stock: any) {
  const crosscuts: any[] = [];
  
  // Group placements that can be made with horizontal cuts
  const horizontalGroups = groupPlacementsByHorizontalAlignment(groupedPlacements);
  
  horizontalGroups.forEach((group, index) => {
    if (group.length > 1) {
      crosscuts.push({
        placements: group.map(g => g.placement),
        cutLine: {
          start: { x: 0, y: findOptimalCutLine(group, 'horizontal') },
          end: { x: stock.length, y: findOptimalCutLine(group, 'horizontal') },
          direction: 'horizontal' as const
        }
      });
    }
  });

  return crosscuts;
}

/**
 * Group placements by vertical alignment
 */
function groupPlacementsByVerticalAlignment(groupedPlacements: any[]) {
  const tolerance = 5; // 5mm tolerance for alignment
  const groups: any[][] = [];

  groupedPlacements.forEach(item => {
    let addedToGroup = false;
    
    for (const group of groups) {
      if (Math.abs(group[0].placement.x - item.placement.x) <= tolerance) {
        group.push(item);
        addedToGroup = true;
        break;
      }
    }
    
    if (!addedToGroup) {
      groups.push([item]);
    }
  });

  return groups;
}

/**
 * Group placements by horizontal alignment
 */
function groupPlacementsByHorizontalAlignment(groupedPlacements: any[]) {
  const tolerance = 5; // 5mm tolerance for alignment
  const groups: any[][] = [];

  groupedPlacements.forEach(item => {
    let addedToGroup = false;
    
    for (const group of groups) {
      if (Math.abs(group[0].placement.y - item.placement.y) <= tolerance) {
        group.push(item);
        addedToGroup = true;
        break;
      }
    }
    
    if (!addedToGroup) {
      groups.push([item]);
    }
  });

  return groups;
}

/**
 * Find optimal cut line for a group
 */
function findOptimalCutLine(group: any[], direction: 'vertical' | 'horizontal'): number {
  if (direction === 'vertical') {
    const positions = group.map(g => g.placement.x);
    return Math.min(...positions) - 5; // Cut 5mm before the first piece
  } else {
    const positions = group.map(g => g.placement.y);
    return Math.min(...positions) - 5; // Cut 5mm before the first piece
  }
}

/**
 * Group consecutive cuts for dimensional lumber
 */
function groupConsecutiveCuts(placements: Placement[], sortedParts: Part[]) {
  const groups: Placement[][] = [];
  let currentGroup: Placement[] = [];

  placements.forEach((placement, index) => {
    if (currentGroup.length === 0) {
      currentGroup.push(placement);
    } else if (placements.length - index <= 2) {
      // Keep last few cuts together
      currentGroup.push(placement);
    } else {
      // Start new group
      groups.push([...currentGroup]);
      currentGroup = [placement];
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Calculate safety score based on cutting sequence
 */
function calculateSafetyScore(steps: CutSequenceStep[], placementCount: number): number {
  let score = 10;

  // Deduct points for complex sequences
  if (steps.length > placementCount) score -= 1;
  
  // Deduct points for high-priority cuts that might be more dangerous
  const highPriorityCuts = steps.filter(s => s.priority === 'high').length;
  score -= highPriorityCuts * 0.5;

  // Bonus for having breakdown steps for large sheets
  const hasBreakdown = steps.some(s => s.cutType === 'initial-breakdown');
  if (hasBreakdown && placementCount > 4) score += 1;

  return Math.max(1, Math.min(10, score));
}

/**
 * Calculate efficiency score based on waste and cut optimization
 */
function calculateEfficiencyScore(steps: CutSequenceStep[], wasteArea: number, stock: any): number {
  let score = 10;
  
  const totalArea = stock.length * stock.width;
  const wastePercentage = (wasteArea / totalArea) * 100;
  
  // Deduct points for high waste
  if (wastePercentage > 30) score -= 3;
  else if (wastePercentage > 20) score -= 2;
  else if (wastePercentage > 10) score -= 1;
  
  // Deduct points for too many steps
  if (steps.length > 6) score -= 1;
  
  // Bonus for having grouped cuts
  const groupedCuts = steps.filter(s => s.placements.length > 1).length;
  if (groupedCuts > 0) score += groupedCuts * 0.5;

  return Math.max(1, Math.min(10, score));
}

/**
 * Estimate cutting time in minutes
 */
function estimateCuttingTime(steps: CutSequenceStep[], materialType: MaterialType): number {
  let totalTime = 0;
  
  steps.forEach(step => {
    switch (step.cutType) {
      case 'initial-breakdown':
        totalTime += 15; // 15 minutes for breaking down large sheets
        break;
      case 'rip':
        totalTime += step.placements.length * 3; // 3 minutes per rip cut
        break;
      case 'crosscut':
        totalTime += step.placements.length * 2; // 2 minutes per crosscut
        break;
      case 'final-trim':
        totalTime += step.placements.length * 1; // 1 minute per trim
        break;
      default:
        totalTime += 5;
    }
  });
  
  // Add setup time
  totalTime += materialType === MaterialType.Sheet ? 10 : 5;
  
  return Math.round(totalTime);
}

/**
 * Generate recommendations based on the cutting sequence
 */
function generateRecommendations(steps: CutSequenceStep[], stock: any, usage: StockUsage): string[] {
  const recommendations = [];
  
  if (steps.length > 5) {
    recommendations.push('Consider making a cutting list and organizing your workspace before starting');
  }
  
  if (stock.materialType === MaterialType.Sheet && stock.length > 1200) {
    recommendations.push('Have a helper available for handling large sheet materials');
  }
  
  const hasFineTrim = steps.some(s => s.cutType === 'final-trim');
  if (hasFineTrim) {
    recommendations.push('Leave pieces slightly oversized for final trimming to exact dimensions');
  }
  
  if (stock.grainDirection) {
    recommendations.push(`Make cuts considering the ${stock.grainDirection} grain direction to minimize tear-out`);
  }
  
  const efficiency = ((stock.length * stock.width - usage.wasteArea) / (stock.length * stock.width)) * 100;
  if (efficiency < 70) {
    recommendations.push('Consider repositioning parts to reduce waste material');
  }
  
  recommendations.push('Always wear appropriate safety equipment and follow tool manufacturer guidelines');
  
  return recommendations;
}
