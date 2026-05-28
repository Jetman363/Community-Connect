import re
from dataclasses import dataclass, field
from enum import Enum


class ThreatIndicator(str, Enum):
    WEAPON = "weapon"
    MEDICAL = "medical"
    DOMESTIC_VIOLENCE = "domestic_violence"
    SUICIDAL = "suicidal"
    OFFICER_SAFETY = "officer_safety"
    PURSUIT = "pursuit"


@dataclass
class ExtractedEntity:
    type: str
    value: str
    confidence: float
    start: int = 0
    end: int = 0


@dataclass
class ParseResult:
    incident_type: str
    priority: str
    dispatch_code: str | None
    suggested_unit_types: list[str]
    narrative_summary: str
    entities: list[ExtractedEntity] = field(default_factory=list)
    threat_indicators: list[str] = field(default_factory=list)
    confidence: float = 0.0
    raw_text: str = ""


VEHICLE_PATTERN = re.compile(
    r"\b(white|black|red|blue|silver|gray|grey|green|yellow|brown|tan|gold|maroon)\s+"
    r"(ford|chevy|chevrolet|toyota|honda|nissan|dodge|ram|gmc|bmw|mercedes|tesla)\s+"
    r"([a-z0-9\-]+(?:\s+[a-z0-9\-]+)?)\b",
    re.IGNORECASE,
)
PLATE_PATTERN = re.compile(r"\b(?:plate|tag|license)\s*[#:]?\s*([A-Z0-9\-]{4,8})\b", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b")
ADDRESS_PATTERN = re.compile(
    r"\b(?:at|near|on|by)\s+(.{5,80}?)(?:\.|,|$|\band\b|\bwhere\b)",
    re.IGNORECASE,
)
DIRECTION_PATTERN = re.compile(r"\b(north|south|east|west)(?:bound|bound on)?\b", re.IGNORECASE)
HIGHWAY_PATTERN = re.compile(r"\b(?:highway|hwy|ih|us|state route|sr|fm)\s*[\d\-]+\b[^.]*", re.IGNORECASE)
WEAPON_KEYWORDS = ["gun", "knife", "weapon", "firearm", "shot", "shooting", "armed", "pistol", "rifle"]
MEDICAL_KEYWORDS = ["heart attack", "chest pain", "unconscious", "not breathing", "overdose", "bleeding", "injured"]
DV_KEYWORDS = ["domestic", "husband hit", "wife hit", "boyfriend", "girlfriend assault"]
SUICIDE_KEYWORDS = ["kill myself", "suicide", "end my life", "want to die"]
OFFICER_THREAT_KEYWORDS = ["kill the police", "cop killer", "shoot the officer", "ambush police"]
DWI_KEYWORDS = ["intoxicated", "drunk", "dwI", "dwi", "swerving", "reckless", "erratic"]
PURSUIT_KEYWORDS = ["fleeing", "pursuit", "running from", "won't stop", "high speed"]


INCIDENT_RULES: list[tuple[list[str], str, str, str | None, list[str]]] = [
    (MEDICAL_KEYWORDS, "medical", "P1", "10-52", ["ems"]),
    (WEAPON_KEYWORDS, "weapons", "P1", "10-71", ["patrol", "supervisor"]),
    (DV_KEYWORDS, "domestic_violence", "P1", "10-16", ["patrol"]),
    (SUICIDE_KEYWORDS, "mental_health", "P1", "10-56", ["patrol", "crisis"]),
    (OFFICER_THREAT_KEYWORDS, "officer_safety", "P1", "10-99", ["patrol", "supervisor"]),
    (PURSUIT_KEYWORDS, "pursuit", "P1", "10-80", ["patrol", "air"]),
    (DWI_KEYWORDS, "traffic", "P2", "10-55", ["patrol"]),
]


def parse_emergency_call(text: str) -> ParseResult:
    normalized = text.strip()
    lower = normalized.lower()
    entities: list[ExtractedEntity] = []
    threats: list[str] = []
    incident_type = "general"
    priority = "P3"
    dispatch_code = None
    suggested_units = ["patrol"]

    for keywords, itype, prio, code, units in INCIDENT_RULES:
        if any(kw in lower for kw in keywords):
            incident_type = itype
            priority = prio
            dispatch_code = code
            suggested_units = units
            break

    for m in VEHICLE_PATTERN.finditer(normalized):
        entities.append(ExtractedEntity("vehicle", m.group(0).strip(), 0.88, m.start(), m.end()))
    for m in PLATE_PATTERN.finditer(normalized):
        entities.append(ExtractedEntity("license_plate", m.group(1), 0.92, m.start(), m.end()))
    for m in PHONE_PATTERN.finditer(normalized):
        entities.append(ExtractedEntity("phone", m.group(1), 0.95, m.start(), m.end()))
    for m in DIRECTION_PATTERN.finditer(normalized):
        entities.append(ExtractedEntity("direction", m.group(0), 0.90, m.start(), m.end()))
    for m in HIGHWAY_PATTERN.finditer(normalized):
        entities.append(ExtractedEntity("location", m.group(0).strip(), 0.85, m.start(), m.end()))
    else:
        addr = ADDRESS_PATTERN.search(normalized)
        if addr:
            entities.append(ExtractedEntity("location", addr.group(1).strip(), 0.75, addr.start(), addr.end()))

    if any(kw in lower for kw in WEAPON_KEYWORDS):
        threats.append(ThreatIndicator.WEAPON.value)
    if any(kw in lower for kw in MEDICAL_KEYWORDS):
        threats.append(ThreatIndicator.MEDICAL.value)
    if any(kw in lower for kw in DV_KEYWORDS):
        threats.append(ThreatIndicator.DOMESTIC_VIOLENCE.value)
    if any(kw in lower for kw in SUICIDE_KEYWORDS):
        threats.append(ThreatIndicator.SUICIDAL.value)
    if any(kw in lower for kw in OFFICER_THREAT_KEYWORDS):
        threats.append(ThreatIndicator.OFFICER_SAFETY.value)
    if any(kw in lower for kw in PURSUIT_KEYWORDS):
        threats.append(ThreatIndicator.PURSUIT.value)

    if threats and priority in ("P3", "P4", "P5"):
        priority = "P1" if any(t in ("weapon", "officer_safety", "medical", "suicidal") for t in threats) else "P2"

    summary_parts = [f"{incident_type.replace('_', ' ').title()} incident"]
    loc = next((e.value for e in entities if e.type == "location"), None)
    veh = next((e.value for e in entities if e.type == "vehicle"), None)
    if loc:
        summary_parts.append(f"at {loc}")
    if veh:
        summary_parts.append(f"involving {veh}")

    confidence = 0.5
    if entities:
        confidence += 0.2
    if incident_type != "general":
        confidence += 0.15
    if threats:
        confidence += 0.1
    confidence = min(confidence, 0.98)

    return ParseResult(
        incident_type=incident_type,
        priority=priority,
        dispatch_code=dispatch_code,
        suggested_unit_types=suggested_units,
        narrative_summary=". ".join(summary_parts) + ".",
        entities=entities,
        threat_indicators=threats,
        confidence=round(confidence, 2),
        raw_text=normalized,
    )
