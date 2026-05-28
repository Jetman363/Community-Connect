from dataclasses import dataclass, field

from app.models import RoutingRule
from app.schemas import ThreatLevel, ThreatScoreResult, UnifiedEvent


@dataclass
class ThreatContext:
    event: UnifiedEvent
    rule_hits: list[str] = field(default_factory=list)
    factors: dict = field(default_factory=dict)


class ThreatPrioritizationEngine:
    """Configurable threat scoring with officer safety and escalation logic."""

    BASE_SCORES = {
        "officer.emergency": 95,
        "officer.officer_emergency": 95,
        "officer.panic": 90,
        "lpr.hit": 55,
        "bolo.hit": 75,
        "cad.dispatch": 40,
        "osint.intel": 35,
        "geofence.breach": 60,
        "camera.motion": 25,
    }

    SEVERITY_WEIGHTS = {"critical": 30, "high": 20, "medium": 10, "info": 0, "low": 0}

    def evaluate(self, event: UnifiedEvent, rules: list[RoutingRule] | None = None) -> ThreatScoreResult:
        ctx = ThreatContext(event=event)
        score = self._base_score(event)
        score += self.SEVERITY_WEIGHTS.get(event.severity.lower(), 0)

        if event.event_type.startswith("officer.") or "officer_emergency" in event.event_type:
            ctx.factors["officer_safety"] = True
            ctx.rule_hits.append("officer_emergency")

        if event.raw_payload.get("bolo_match"):
            score += 25
            ctx.rule_hits.append("bolo_match")
            ctx.factors["bolo_match"] = True

        if event.geolocation:
            score += 5
            ctx.factors["geolocated"] = True

        for rule in rules or []:
            hit = self._evaluate_rule(rule, event)
            if hit:
                ctx.rule_hits.append(rule.name)
                score += rule.actions.get("score_boost", 10)
                if rule.actions.get("escalate"):
                    ctx.factors["rule_escalation"] = rule.name

        score = min(100.0, max(0.0, float(score)))
        threat_level = self._classify(score)
        officer_safety = bool(ctx.factors.get("officer_safety")) or threat_level == ThreatLevel.CRITICAL
        escalated = bool(ctx.factors.get("rule_escalation")) or threat_level in (ThreatLevel.HIGH, ThreatLevel.CRITICAL)

        return ThreatScoreResult(
            score=score,
            threat_level=threat_level,
            officer_safety=officer_safety,
            escalated=escalated,
            factors=ctx.factors,
            rule_hits=ctx.rule_hits,
        )

    def _base_score(self, event: UnifiedEvent) -> float:
        for prefix, value in self.BASE_SCORES.items():
            if event.event_type.startswith(prefix) or prefix in event.event_type:
                return float(value)
        return 20.0

    def _classify(self, score: float) -> ThreatLevel:
        if score >= 85:
            return ThreatLevel.CRITICAL
        if score >= 65:
            return ThreatLevel.HIGH
        if score >= 40:
            return ThreatLevel.MEDIUM
        return ThreatLevel.LOW

    def _evaluate_rule(self, rule: RoutingRule, event: UnifiedEvent) -> bool:
        conditions = rule.conditions or {}
        if conditions.get("event_type") and conditions["event_type"] != event.event_type:
            return False
        if conditions.get("source_system") and conditions["source_system"] != event.source_system:
            return False
        if conditions.get("min_severity"):
            order = ["info", "low", "medium", "high", "critical"]
            if order.index(event.severity.lower()) < order.index(conditions["min_severity"].lower()):
                return False
        if conditions.get("geofence") and event.geolocation:
            return self._point_in_geofence(event.geolocation, conditions["geofence"])
        if rule.rule_type == "bolo_hit" and event.raw_payload.get("bolo_match"):
            return True
        if rule.rule_type == "officer_emergency" and "officer" in event.event_type:
            return True
        if rule.rule_type == "stolen_vehicle" and event.raw_payload.get("stolen"):
            return True
        return rule.rule_type == "custom"

    @staticmethod
    def _point_in_geofence(point: dict, geofence: dict) -> bool:
        lat = point.get("lat")
        lon = point.get("lon")
        center = geofence.get("center", {})
        radius_km = geofence.get("radius_km", 1.0)
        if lat is None or lon is None or not center:
            return False
        import math

        dlat = math.radians(center["lat"] - lat)
        dlon = math.radians(center["lon"] - lon)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat)) * math.cos(math.radians(center["lat"])) * math.sin(dlon / 2) ** 2
        dist_km = 6371 * 2 * math.asin(math.sqrt(a))
        return dist_km <= radius_km


threat_engine = ThreatPrioritizationEngine()
