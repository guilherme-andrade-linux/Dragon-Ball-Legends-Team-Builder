import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyATIMePBMDrIQ7uOGiKrBKfgAhK8IgDJRw",
    authDomain: "dbl-team-builder.firebaseapp.com",
    projectId: "dbl-team-builder",
    storageBucket: "dbl-team-builder.firebasestorage.app",
    messagingSenderId: "649225970942",
    appId: "1:649225970942:web:14f58d3bc9e1c0f266f1af",
    measurementId: "G-5XBM7YY34G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- STATE ---
let allCharacters = [];
let team = [null, null, null, null, null, null]; // 6 Slots
let currentAnalysisIndex = 0; // Index of the character being analyzed (0-5)

// --- INIT ---
document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('btnLoadFirebase').addEventListener('click', fetchFromFirebase);
renderTeamSlots();

// --- FUNCTIONS ---

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            allCharacters = JSON.parse(e.target.result);
            populateTagFilter(allCharacters);
            renderGrid(allCharacters);
            alert(`Sucesso! ${allCharacters.length} personagens carregados.`);
        } catch (error) {
            alert("Erro ao ler JSON. Verifica o formato.");
            console.error(error);
        }
    };
    reader.readAsText(file);
}

async function fetchFromFirebase() {
    const btn = document.getElementById('btnLoadFirebase');
    const originalText = btn.innerText;
    btn.innerText = "⏳ A carregar...";
    btn.disabled = true;

    try {
        const querySnapshot = await getDocs(collection(db, "characters"));
        allCharacters = [];
        querySnapshot.forEach((doc) => {
            allCharacters.push(doc.data());
        });

        if (allCharacters.length === 0) {
            alert("Nenhum personagem encontrado no Firebase.");
        } else {
            populateTagFilter(allCharacters);
            renderGrid(allCharacters);
            alert(`Sucesso! ${allCharacters.length} personagens carregados do Firebase.`);
        }

    } catch (error) {
        console.error("Erro ao carregar do Firebase:", error);
        alert("Erro ao carregar do Firebase. Verifica a consola.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function renderGrid(chars) {
    const grid = document.getElementById('charGrid');
    grid.innerHTML = '';

    chars.forEach(char => {
        const div = document.createElement('div');
        div.className = `char-card el-${char.element}`;
        div.onclick = () => addToTeam(char);

        // --- ALTERAÇÃO AQUI ---
        // Se existir imagem, usa-a. Senão, usa o fallback de texto.
        let imageContent;
        if (char.image) {
            imageContent = `<img src="${char.image}" alt="${char.name}" loading="lazy">`;
        } else {
            imageContent = `
                <div style="background:#333; height:60px; display:flex; align-items:center; justify-content:center; border-radius:4px; font-weight:bold; color:var(--accent);">
                    ${char.rarity === 'ULTRA' ? 'UL' : 'SP'}
                </div>`;
        }

        div.innerHTML = `
            ${imageContent}
            <div class="char-name">${char.name}</div>
            <div style="font-size:0.6rem; color:#888">${char.element}</div>
        `;
        // ----------------------

        grid.appendChild(div);
    });
}

let zenkaiFilterActive = false;

function filterGrid() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const tag = document.getElementById('tagFilter').value;

    const filtered = allCharacters.filter(c => {
        const matchesName = c.name.toLowerCase().includes(term);
        const matchesTag = tag === "" || (c.visual_tags && c.visual_tags.includes(tag));
        const matchesZenkai = !zenkaiFilterActive || (c.zenkai_id && c.zenkai_id !== "-1");
        return matchesName && matchesTag && matchesZenkai;
    });
    renderGrid(filtered);
}

function toggleZenkaiFilter() {
    zenkaiFilterActive = !zenkaiFilterActive;
    const btn = document.getElementById('btnZenkai');
    if (zenkaiFilterActive) {
        btn.style.background = "var(--accent)";
        btn.style.color = "black";
        btn.style.borderColor = "var(--accent)";
    } else {
        btn.style.background = "#333";
        btn.style.color = "white";
        btn.style.borderColor = "#555";
    }
    filterGrid();
}

function clearFilters() {
    document.getElementById('searchInput').value = "";
    document.getElementById('tagFilter').value = "";

    zenkaiFilterActive = false;
    const btn = document.getElementById('btnZenkai');
    btn.style.background = "#333";
    btn.style.color = "white";
    btn.style.borderColor = "#555";

    filterGrid();
}

function populateTagFilter(chars) {
    const tagCounts = {};
    chars.forEach(c => {
        if (c.visual_tags && Array.isArray(c.visual_tags)) {
            // Deduplicate tags for this character to avoid double counting
            const uniqueTags = new Set(c.visual_tags);
            uniqueTags.forEach(t => {
                tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
        }
    });

    const sortedTags = Object.keys(tagCounts)
        .filter(tag => tagCounts[tag] > 1)
        .sort();

    const select = document.getElementById('tagFilter');

    // Manter a opção default
    select.innerHTML = '<option value="">Todas as Tags</option>';

    sortedTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.innerText = `${tag} (${tagCounts[tag]})`; // Added count for better UX, though not explicitly asked, it's helpful
        select.appendChild(option);
    });
}

function addToTeam(char) {
    // Check for duplicates
    const isAlreadyInTeam = team.some(member => member && member.internal_id === char.internal_id);
    if (isAlreadyInTeam) {
        alert("Este personagem já está na equipa!");
        return;
    }

    // Find first empty slot
    const emptyIndex = team.findIndex(s => s === null);
    if (emptyIndex !== -1) {
        team[emptyIndex] = char;
        renderTeamSlots();
        calculateStats();
        renderAnalysis(); // Update analysis when team changes
    } else {
        alert("A equipa está cheia! Remove alguém primeiro.");
    }
}

function removeFromTeam(index) {
    team[index] = null;
    renderTeamSlots();
    calculateStats();
    renderAnalysis(); // Update analysis when team changes
}

function renderTeamSlots() {
    const container = document.getElementById('teamContainer');
    container.innerHTML = '';

    team.forEach((char, index) => {
        const slot = document.createElement('div');
        slot.className = `team-slot ${char ? 'filled' : ''}`;
        slot.onclick = () => char ? removeFromTeam(index) : null;

        const label = index === 0 ? "LEADER" : `MEMBER ${index}`;

        if (char) {
            // Usa a imagem se existir
            const bgImage = char.image ? `background-image: url('${char.image}'); background-size: cover; background-position: top center;` : 'background: #252525;';

            slot.innerHTML = `
                <div class="slot-label" style="color: gold">${label}</div>
                <div style="width:100%; height:100%; ${bgImage} display:flex; flex-direction:column; align-items:center; justify-content:flex-end;">
                    <div class="slot-info">
                        <h3 style="margin:0; text-shadow: 2px 2px 4px #000;">${char.name}</h3>
                        <span style="color:#ddd; text-shadow: 1px 1px 2px #000;">${char.rarity} - ${char.element}</span>
                    </div>
                </div>
            `;
            slot.style.borderColor = getElementColor(char.element);
        } else {
            slot.innerHTML = `<div class="slot-label">${label}</div><span style="color:#444; font-size:2rem;">+</span>`;
            slot.style.borderColor = "#444";
        }

        container.appendChild(slot);
    });
}

function getElementColor(el) {
    const map = { 'RED': '#ff4d4d', 'YEL': '#ffd700', 'PUR': '#bf55ec', 'GRN': '#2ecc71', 'BLU': '#3498db', 'LGT': '#fff' };
    return map[el] || '#fff';
}

// --- CORE LOGIC: STATS ---
function calculateStats() {
    let totalPower = 0;
    let abilityBonus = 0;

    // Raw Stats Accumulators
    let statsSum = { hp: 0, strikeAtk: 0, blastAtk: 0, strikeDef: 0, blastDef: 0 };
    const characterLinksHTML = [];

    team.forEach(char => {
        if (!char) return;

        // 1. Sum Raw Stats (Parse string "2,400" to int)
        if (char.stats) {
            // Tenta obter o stat, remove virgulas
            const getStat = (key) => parseInt((char.stats[key] || "0").replace(/,/g, ''));

            const hp = getStat('Health') || getStat('体力'); // Fallback para possiveis keys diferentes
            const sAtk = getStat('Strike Attack');
            const bAtk = getStat('Blast Attack');
            const sDef = getStat('Strike Defense');
            const bDef = getStat('Blast Defense');

            statsSum.hp += hp;
            statsSum.strikeAtk += sAtk;
            statsSum.blastAtk += bAtk;
            statsSum.strikeDef += sDef;
            statsSum.blastDef += bDef;

            // Power Level aproximado (soma simples para demo)
            totalPower += (hp + sAtk + bAtk + sDef + bDef);
        }

        // 2. Parse Z-Ability (A última da lista costuma ser a mais forte)
        if (char.z_abilities && char.z_abilities.length > 0) {
            const bestAbility = char.z_abilities[char.z_abilities.length - 1];
            const desc = bestAbility.description;

            // Extrair percentagens da string (Ex: "+30%")
            const percentages = desc.match(/\+(\d+)%/g);
            if (percentages) {
                percentages.forEach(p => {
                    abilityBonus += parseInt(p.replace(/\D/g, ''));
                });
            }
        }

        // Generate Link
        if (char.url) {
            characterLinksHTML.push(`
                <a href="${char.url}" target="_blank" class="char-link" style="border-left-color:${getElementColor(char.element)}">
                    ${char.name} <span style="float:right; font-size:0.8em">↗</span>
                </a>
            `);
        }
    });

    // Update DOM
    document.getElementById('totalPower').innerText = totalPower.toLocaleString();
    document.getElementById('totalAbilityBonus').innerText = abilityBonus + "%";

    document.getElementById('statHP').innerText = statsSum.hp.toLocaleString();
    document.getElementById('statStrikeAtk').innerText = statsSum.strikeAtk.toLocaleString();
    document.getElementById('statBlastAtk').innerText = statsSum.blastAtk.toLocaleString();
    document.getElementById('statStrikeDef').innerText = statsSum.strikeDef.toLocaleString();
    document.getElementById('statBlastDef').innerText = statsSum.blastDef.toLocaleString();

    document.getElementById('characterLinks').innerHTML = characterLinksHTML.join('');
}

// --- ANALYSIS LOGIC ---

function prevAnalysisChar() {
    currentAnalysisIndex = (currentAnalysisIndex - 1 + 6) % 6;
    renderAnalysis();
}

function nextAnalysisChar() {
    currentAnalysisIndex = (currentAnalysisIndex + 1) % 6;
    renderAnalysis();
}

function renderAnalysis() {
    const section = document.getElementById('analysisSection');
    const charDisplay = document.getElementById('analysisCharDisplay');
    const fullList = document.getElementById('zAbilityFull');
    const partialList = document.getElementById('zAbilityPartial');
    const noneList = document.getElementById('zAbilityNone');

    const subjectChar = team[currentAnalysisIndex];

    // Show/Hide section based on if there's a character to analyze
    if (!subjectChar) {
        // Try to find the first available character if current slot is empty
        const firstCharIndex = team.findIndex(c => c !== null);
        if (firstCharIndex !== -1) {
            currentAnalysisIndex = firstCharIndex;
            // Recursively call to render the found character
            // Use setTimeout to avoid potential stack overflow in weird edge cases, though unlikely here
            setTimeout(renderAnalysis, 0);
            return;
        }

        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // Render Header
    let imageContent = subjectChar.image
        ? `<img src="${subjectChar.image}" class="analysis-char-img">`
        : `<div class="analysis-char-img" style="background:#333; display:flex; align-items:center; justify-content:center; font-weight:bold;">${subjectChar.rarity === 'ULTRA' ? 'UL' : 'SP'}</div>`;

    charDisplay.innerHTML = `
        ${imageContent}
        <div>
            <div style="font-size: 0.8rem; color: #888;">Slot ${currentAnalysisIndex + 1}</div>
            <div style="font-size: 1.1rem; font-weight: bold; color: var(--accent);">${subjectChar.name}</div>
        </div>
    `;

    // Clear Lists
    fullList.innerHTML = '';
    partialList.innerHTML = '';
    noneList.innerHTML = '';

    // Analyze Z-Abilities from Teammates
    team.forEach((giver, index) => {
        if (!giver) return;

        // Z-Ability Check
        if (giver.z_abilities && giver.z_abilities.length > 0) {
            const bestAbility = giver.z_abilities[giver.z_abilities.length - 1];
            let coverage = checkZAbilityCoverage(subjectChar, bestAbility.description);

            // Leader Slot Logic:
            // 1. Leader (Slot 0) receives everything.
            // 2. Leader (Slot 0) gives to everyone.
            const isSubjectLeader = currentAnalysisIndex === 0;
            const isGiverLeader = index === 0;

            if (isSubjectLeader || isGiverLeader) {
                coverage = { type: 'full' };
            }

            const itemHTML = `
                <div class="z-item ${coverage.type}">
                    <strong style="color:${getElementColor(giver.element)}">${giver.name}</strong><br>
                    ${bestAbility.description}
                </div>
            `;

            if (coverage.type === 'full') fullList.innerHTML += itemHTML;
            else if (coverage.type === 'partial') partialList.innerHTML += itemHTML;
            else noneList.innerHTML += itemHTML;
        }

        // Zenkai Ability Check
        if (giver.zenkai_id && giver.zenkai_id !== "-1" && giver.zenkai_abilities && giver.zenkai_abilities.length > 0) {
            const bestZenkai = giver.zenkai_abilities[giver.zenkai_abilities.length - 1];
            const isZenkaiApplicable = checkZenkaiCoverage(giver, subjectChar, bestZenkai.description);

            const zenkaiHTML = `
                <div class="zenkai-item ${isZenkaiApplicable ? '' : 'none'}">
                    <span class="zenkai-label">ZENKAI</span>
                    <strong style="color:${getElementColor(giver.element)}">${giver.name}</strong><br>
                    ${bestZenkai.description}
                </div>
            `;

            if (isZenkaiApplicable) {
                // Zenkai is usually very specific, so we treat it as a "Full" buff if applicable.
                // We append it to the top of the full list or a specific section.
                // Let's put it at the top of Full List for visibility.
                fullList.innerHTML = zenkaiHTML + fullList.innerHTML;
            } else {
                // If not applicable, add to None list
                noneList.innerHTML += zenkaiHTML;
            }
        }
    });
}

function checkZenkaiCoverage(giver, receiver, description) {
    // Format A: "Increases ... both "Element: X" and "Tag: Y" (or "Episode: Y" or "Rarity: Y") ..."
    if (description.includes("Element:") && (description.includes("Tag:") || description.includes("Episode:") || description.includes("Rarity:") || description.includes("Character:"))) {
        const elementMatch = description.match(/"Element: (.*?)"/);
        // Match "Tag:", "Episode:", or "Rarity:"
        const tagMatch = description.match(/"(?:Tag|Episode|Rarity|Character): (.*?)"/);

        if (elementMatch && tagMatch) {
            const reqElement = elementMatch[1];
            const reqTag = tagMatch[1];
            return checkTag(receiver, reqElement) && checkTag(receiver, reqTag);
        }
    }

    // Format B: "If & [Tag] ..." (Implied Element from Giver)
    // Example: "Zenkai Ability IV If & GT ..."
    if (description.includes("If &")) {
        // Extract tag after "If &" until "・" or end
        const match = description.match(/If & (.*?)(?:・|$)/);
        if (match) {
            const reqTag = match[1].trim();
            const reqElement = giver.element; // Implied from Giver
            return checkTag(receiver, reqElement) && checkTag(receiver, reqTag);
        }
    }

    return false;
}

function checkZAbilityCoverage(receiver, description) {
    // Strategy: Determine format and split into clauses.
    // Calculate how many clauses are met.

    let clauses = [];

    // Format A: "If [Tag] ..." (New Style)
    if (description.includes("If ")) {
        const parts = description.split('If ').filter(p => p.trim().length > 0);

        parts.forEach(part => {
            const dotIndex = part.indexOf('・');
            if (dotIndex !== -1) {
                const condStr = part.substring(0, dotIndex).trim();

                // Check for "&" which implies AND condition (Must have ALL tags)
                if (condStr.includes('&')) {
                    const tags = condStr.split('&')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                    clauses.push({ tags: tags, raw: part, mode: 'AND' });
                } else {
                    // Default OR condition (Must have ANY tag)
                    // Split by "," AND " or "
                    const tags = condStr.split(/,| or /i)
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                    clauses.push({ tags: tags, raw: part, mode: 'OR' });
                }
            }
        });
    }
    // Format B: "+XX% to "Tag: ..."" (Old Style)
    else if (description.includes("%")) {
        const matches = description.match(/(\+\d+%[^+\n]*)/g);
        if (matches) {
            matches.forEach(m => {
                const tags = [];
                // Updated regex to include "Element"
                const tagMatches = [...m.matchAll(/"(Tag|Episode|Element|Character): (.*?)"/g)];
                tagMatches.forEach(tm => tags.push(tm[2]));

                if (tags.length > 0) {
                    clauses.push({ tags: tags, raw: m, mode: 'OR' });
                }
            });
        }
    }

    if (clauses.length === 0) return { type: 'none' };

    let metClauses = 0;

    clauses.forEach(clause => {
        let matches = false;

        if (clause.mode === 'AND') {
            // Must match ALL tags
            matches = clause.tags.every(req => checkTag(receiver, req));
        } else {
            // Must match ANY tag (default)
            matches = clause.tags.some(req => checkTag(receiver, req));
        }

        if (matches) metClauses++;
    });

    if (metClauses === clauses.length) return { type: 'full' };
    if (metClauses > 0) return { type: 'partial' };
    return { type: 'none' };
}

function checkTag(receiver, req) {
    const reqNorm = req.toLowerCase();

    // Check Element
    if (['red', 'yel', 'pur', 'grn', 'blu', 'lgt'].includes(reqNorm)) {
        return receiver.element.toLowerCase() === reqNorm;
    }

    // Check Tags
    if (receiver.visual_tags) {
        return receiver.visual_tags.some(t => t.toLowerCase() === reqNorm);
    }
    return false;
}

// --- EXPOSE TO WINDOW (Required for HTML inline events) ---
window.handleFileUpload = handleFileUpload;
window.filterGrid = filterGrid;
window.toggleZenkaiFilter = toggleZenkaiFilter;
window.clearFilters = clearFilters;
window.addToTeam = addToTeam;
window.removeFromTeam = removeFromTeam;
window.prevAnalysisChar = prevAnalysisChar;
window.nextAnalysisChar = nextAnalysisChar;
