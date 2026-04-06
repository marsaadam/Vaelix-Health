// Build the full Claude prompt with patient data + Vaelix database
const d = $input.first().json;

// Parse labs JSON
let labsFormatted = '';
try {
  const labs = JSON.parse(d.labs || '{}');
  labsFormatted = Object.entries(labs)
    .map(([k,v]) => `${k}: ${v}`)
    .join('\n');
} catch(e) {
  labsFormatted = d.labs || 'Nincs megadva';
}

const isPremiumOrVip = d.plan === 'Premium' || d.plan === 'VIP';
const isVip = d.plan === 'VIP';

// Fetch database from GitHub
let dbContent = '';
try {
  const dbResponse = await fetch('https://raw.githubusercontent.com/marsaadam/Vaelix-Health/main/vaelix_db_for_prompt.json');
  const dbJson = await dbResponse.json();
  dbContent = JSON.stringify(dbJson);
} catch(e) {
  dbContent = 'Adatbázis nem elérhető';
}

const prompt = `Te egy funkcionális medicina orientált elemző vagy. Kizárólag tudományosan alátámasztott összefüggéseket tárj fel.

SZIGORÚAN TILOS: diagnózis felállítása, gyógyszer felírás, "betegséged van" típusú mondatok.
KÖTELEZŐ NYELV: "Ebben a kombinációban gyakran látjuk...", "Ez a minta magyarázhatja..."

MINDEN OLDAL TETEJÉN ÉS ALJÁN VASTAGON:
"Ez nem orvosi diagnózis. Tájékoztató jellegű korrelációs elemzés nyilvános tudományos források alapján. Minden egészségügyi döntés előtt feltétlenül konzultálj szakorvossal."

CSOMAG: ${d.plan}
${!isPremiumOrVip ? '- Basic: Executive Summary (top 3 minta) + Labor tábla + első 30 nap terv + szupplementáció + orvos javaslat. NINCS nutrition blueprint.' : ''}
${isPremiumOrVip ? `- ${d.plan}: Teljes struktúra + Nutrition Blueprint + 90 napos követés.` : ''}
${isVip ? '- VIP EXTRA: Havi check-in útmutató + figyelmeztető jelek + éves terv + 2. személy.' : ''}

═══ PÁCIENS ADATAI ═══
Név: ${d.name}
Kor: ${d.age} év | Magasság: ${d.height} cm | Súly: ${d.weight} kg | Nem: ${d.sex}
Dohányzás: ${d.smoking} | Alkohol: ${d.alcohol}

═══ ÉLETMÓD ═══
Edzés: ${d.exercise_frequency} – ${d.exercise_type}
Alvás: ${d.sleep_hours} | Minőség: ${d.sleep_quality}/10 | Stressz: ${d.stress_level}/10
Étrend: ${d.diet} | Víz: ${d.water} | Napfény: ${d.sun}

═══ TÜNETEK ═══
${d.symptoms}
Időtartam: ${d.symptom_duration} | Súlyosság: ${d.symptom_severity}/10
Mintázat: ${d.symptom_pattern}

═══ KÓRTÖRTÉNET ═══
Diagnózisok: ${d.diagnoses}
Családi anamnézis: ${d.family_history}
Gyógyszerek: ${d.medications}
Jelenleg szed: ${d.supplements}
Allergia/Intolerancia: ${d.allergies}

═══ LABORÉRTÉKEK ═══
${labsFormatted}
Abnormális jelzések: ${d.abnormal}
Lab link: ${d.lablink}

═══ CÉLOK ═══
Cél: ${d.goal}
Mikor érezte jól magát: ${d.last_well}
Trigger: ${d.trigger}
Mit szeretne megoldani: ${d.wish}
Mit próbált már: ${d.tried}
Egyéb: ${d.extra}

${isPremiumOrVip && d.cal_kcal ? `═══ KALÓRIA ADATOK ═══\nKalória: ${d.cal_kcal} kcal | Protein: ${d.cal_prot}g | Szénhidrát: ${d.cal_carb}g | Zsír: ${d.cal_fat}g` : ''}

═══ VAELIX KORRELÁCIÓS ADATBÁZIS ═══
Az alábbi adatbázis alapján azonosítsd a páciens adataira illő mintákat.
Minden releváns rekordot használj fel az elemzéshez.

${dbContent}

═══ RIPORT STRUKTÚRA ═══

1. EXECUTIVE SUMMARY (${isPremiumOrVip ? '5' : '3'} legfontosabb minta, sürgősséggel 🔴🟡🟢)
2. LABORÉRTÉKEK TÁBLÁZAT (érték | labor ref | funkcionális optimum | státusz | miért fontos)
3. PRIORITÁSI TERV (14 nap / 30 nap${isPremiumOrVip ? ' / 90 nap / utána' : ''})
4. KONKRÉT JAVASLATOK:
   A) Szupplementáció (dózis, forma, időzítés, ne mellé, meddig, HUF/hó)
   B) Étrend (allergiát figyelembe véve!)
   C) Orvoshoz menés (szakorvos típus + kész mondat + milyen labort kérjen)
${isPremiumOrVip ? '5. NUTRITION BLUEPRINT (7 napos étrend + bevásárlólista + csere tábla)\n6. 90 NAPOS KÖVETÉSI TERV + labor lista' : ''}
${isVip ? '7. VIP EXTRA: Havi check-in útmutató + figyelmeztető jelek + éves újraelemzési terv' : ''}

FONTOS: Az allergia/intolerancia (${d.allergies}) MINDEN javaslat mellett figyelembe kell venni.`;

return [{ json: { ...d, claude_prompt: prompt } }];
