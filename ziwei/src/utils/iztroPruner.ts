import { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe';

/**
 * Extracts essential data from the iztro astrolabe object to create a pruned,
 * highly readable Markdown summary. This summary is used to provide context
 * to the LLM while saving token usage.
 * Dynamically detects chart language to output correct translation labels.
 */
export function extractChartSummary(astrolabe: IFunctionalAstrolabe): string {
  // Detect language based on gender string
  const isZh = astrolabe.gender === '男' || astrolabe.gender === '女';

  // 1. Basic Information
  let md = isZh ? `## 用户命盘基本信息\n` : `## User Astrology Profile\n`;
  md += `- **${isZh ? '性别' : 'Gender'}**: ${astrolabe.gender}\n`;
  md += `- **${isZh ? '阳历出生日期' : 'Solar Birth Date'}**: ${astrolabe.solarDate}\n`;
  md += `- **${isZh ? '农历出生日期' : 'Lunar Birth Date'}**: ${astrolabe.lunarDate}\n`;
  md += `- **${isZh ? '四柱八字' : 'Four Pillars (Ba Zi)'}**: ${astrolabe.chineseDate}\n`;
  md += `- **${isZh ? '出生时辰' : 'Birth Time (Shi Chen)'}**: ${astrolabe.time} (${astrolabe.timeRange})\n`;
  md += `- **${isZh ? '生肖 / 星座' : 'Zodiac / Western Sign'}**: ${astrolabe.zodiac} / ${astrolabe.sign}\n`;
  md += `- **${isZh ? '命主 / 身主' : 'Destiny Master (Soul / Body)'}**: ${astrolabe.soul} / ${astrolabe.body}\n`;
  md += `- **${isZh ? '五行局' : 'Five Elements Phase (五行局)'}**: ${astrolabe.fiveElementsClass}\n\n`;

  // 2. Locate Destiny Palace (命宫)
  // Find by comparing branch with earthlyBranchOfSoulPalace (language-independent)
  const destinyPalace = astrolabe.palaces.find(
    (p) => p.earthlyBranch === astrolabe.earthlyBranchOfSoulPalace
  );

  if (destinyPalace) {
    md += isZh ? `## 命宫格局\n` : `## Destiny Palace\n`;
    md += `- **${isZh ? '宫位干支' : 'Location'}**: ${destinyPalace.heavenlyStem}${destinyPalace.earthlyBranch}\n`;
    
    const majorStars = destinyPalace.majorStars.map(s => `${s.name}(${s.brightness || ''})${s.mutagen ? (isZh ? '·化' : '·') + s.mutagen : ''}`).join(', ');
    md += `- **${isZh ? '主星' : 'Major Stars'}**: ${majorStars || (isZh ? '无 (空宫)' : 'None (Empty Palace)')}\n`;
    
    const minorStars = destinyPalace.minorStars.map(s => s.name).join(', ');
    md += `- **${isZh ? '辅星' : 'Minor Stars'}**: ${minorStars || (isZh ? '无' : 'None')}\n`;
    
    const mutagens: string[] = [];
    destinyPalace.majorStars.forEach(s => { if (s.mutagen) mutagens.push(s.name + (isZh ? '化' : '') + s.mutagen); });
    destinyPalace.minorStars.forEach(s => { if (s.mutagen) mutagens.push(s.name + (isZh ? '化' : '') + s.mutagen); });
    md += `- **${isZh ? '生年四化' : 'Transformations (四化)'}**: ${mutagens.join(', ') || (isZh ? '无' : 'None')}\n\n`;
  }

  // 3. San Fang Si Zheng (三方四正) for Destiny Palace
  md += isZh ? `## 三方四正格局\n` : `## San Fang Si Zheng (Trine and Opposite Palaces)\n`;
  try {
    const targetPalace = astrolabe.palaces.find(p => p.earthlyBranch === astrolabe.earthlyBranchOfSoulPalace);
    const targetIndex = targetPalace ? targetPalace.index : 0;
    const sur = astrolabe.surroundedPalaces(targetIndex);
    const palacesList = [
      { role: isZh ? '本宫 (命宫)' : 'Target (Destiny)', palace: sur.target },
      { role: isZh ? '对宫 (迁移宫)' : 'Opposite (Travel)', palace: sur.opposite },
      { role: isZh ? '财帛位 (财帛宫)' : 'Wealth (Wealth)', palace: sur.wealth },
      { role: isZh ? '官禄位 (官禄宫)' : 'Career (Career)', palace: sur.career }
    ];

    palacesList.forEach(({ role, palace }) => {
      if (palace) {
        const majorStars = palace.majorStars.map(s => `${s.name}(${s.brightness || ''})${s.mutagen ? (isZh ? '·化' : '·') + s.mutagen : ''}`).join(', ');
        const mutagens: string[] = [];
        palace.majorStars.forEach(s => { if (s.mutagen) mutagens.push(s.name + (isZh ? '化' : '') + s.mutagen); });
        palace.minorStars.forEach(s => { if (s.mutagen) mutagens.push(s.name + (isZh ? '化' : '') + s.mutagen); });
        
        md += `### ${role}: ${palace.name} (${palace.heavenlyStem}${palace.earthlyBranch})\n`;
        md += `- **${isZh ? '主星' : 'Major Stars'}**: ${majorStars || (isZh ? '无 (空宫)' : 'None (Empty)')}\n`;
        if (mutagens.length > 0) {
          md += `- **${isZh ? '四化' : 'Transformations (四化)'}**: ${mutagens.join(', ')}\n`;
        }
      }
    });
    md += '\n';
  } catch (e) {
    md += `*Could not compute San Fang Si Zheng: ${e}*\n\n`;
  }

  // 4. Current Decadal (大限) and Current Annual (流年) Horoscopes
  try {
    const horoscope = astrolabe.horoscope(new Date());
    
    // Decade (大限)
    const decIndex = horoscope.decadal.index;
    const decPalace = astrolabe.palaces[decIndex];
    if (decPalace) {
      const majorStars = decPalace.majorStars.map(s => `${s.name}(${s.brightness || ''})`).join(', ');
      md += isZh ? `## 当前十年大限运势 (大限 - 虚岁 ${horoscope.decadal.name})\n` : `## Current Decade (Decade - Ages ${horoscope.decadal.name})\n`;
      md += `- **${isZh ? '大限宫位' : 'Decade Palace'}**: ${decPalace.name} (${decPalace.heavenlyStem}${decPalace.earthlyBranch})\n`;
      md += `- **${isZh ? '大限主星' : 'Decade Major Stars'}**: ${majorStars || (isZh ? '无' : 'None')}\n`;
      if (horoscope.decadal.mutagen && horoscope.decadal.mutagen.length > 0) {
        md += `- **${isZh ? '大限四化' : 'Decade Transformations'}**: ${horoscope.decadal.mutagen.join(', ')}\n`;
      }
      md += '\n';
    }

    // Year (流年)
    const yearIndex = horoscope.yearly.index;
    const yearPalace = astrolabe.palaces[yearIndex];
    if (yearPalace) {
      const majorStars = yearPalace.majorStars.map(s => `${s.name}(${s.brightness || ''})`).join(', ');
      md += isZh ? `## 当前流年运势 (流年 - ${horoscope.yearly.name}年)\n` : `## Current Year (Year - Year ${horoscope.yearly.name})\n`;
      md += `- **${isZh ? '流年宫位' : 'Year Palace'}**: ${yearPalace.name} (${yearPalace.heavenlyStem}${yearPalace.earthlyBranch})\n`;
      md += `- **${isZh ? '流年主星' : 'Year Major Stars'}**: ${majorStars || (isZh ? '无' : 'None')}\n`;
      if (horoscope.yearly.mutagen && horoscope.yearly.mutagen.length > 0) {
        md += `- **${isZh ? '流年四化' : 'Year Transformations'}**: ${horoscope.yearly.mutagen.join(', ')}\n`;
      }
      md += '\n';
    }
  } catch (e) {
    md += isZh ? `## 运限分析\n` : `## Current Cycles (Horoscopes)\n`;
    md += `*Could not compute active horoscope cycles: ${e}*\n\n`;
  }

  return md;
}
