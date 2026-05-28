from app.models import RoutingRule
from app.schemas import UnifiedEvent


class AlertRuleEngine:
    """Configurable rule evaluation for geofence, BOLO, officer emergency, and intelligence matches."""

    RULE_TYPES = {
        "geofence_trigger",
        "repeat_offender",
        "bolo_hit",
        "officer_emergency",
        "gang_intelligence",
        "stolen_vehicle",
        "suspicious_vehicle_pattern",
        "custom",
    }

    def evaluate(self, event: UnifiedEvent, rules: list[RoutingRule]) -> list[dict]:
        hits: list[dict] = []
        for rule in sorted(rules, key=lambda r: r.priority):
            if not rule.enabled:
                continue
            matched = self._match(rule, event)
            if matched:
                hits.append({"rule_id": rule.id, "rule_name": rule.name, "rule_type": rule.rule_type, "actions": rule.actions})
        return hits

    def _match(self, rule: RoutingRule, event: UnifiedEvent) -> bool:
        handler = {
            "geofence_trigger": self._geofence_trigger,
            "repeat_offender": self._repeat_offender,
            "bolo_hit": self._bolo_hit,
            "officer_emergency": self._officer_emergency,
            "gang_intelligence": self._gang_intelligence,
            "stolen_vehicle": self._stolen_vehicle,
            "suspicious_vehicle_pattern": self._suspicious_vehicle_pattern,
        }.get(rule.rule_type, self._custom)
        return handler(rule, event)

    def _geofence_trigger(self, rule: RoutingRule, event: UnifiedEvent) -> bool:
        if not event.geolocation or not rule.conditions.get("geofence"):
            return False
        from app.services.threat_engine import ThreatPrioritizationEngine

        return ThreatPrioritizationEngine._point_in_geofence(event.geolocation, rule.conditions["geofence"])

    def _repeat_offender(self, rule: RoutingRule, event: UnifiedEvent) -> bool:
        offender_id = rule.conditions.get("offender_id")
        return bool(offender_id and any(e.get("id") == offender_id for e in event.entities))

    def _bolo_hit(self, _rule: RoutingRule, event: UnifiedEvent) -> bool:
        return bool(event.raw_payload.get("bolo_match")) or "bolo" in event.event_type

    def _officer_emergency(self, _rule: RoutingRule, event: UnifiedEvent) -> bool:
        return event.event_type.startswith("officer.") or "officer_emergency" in event.event_type

    def _gang_intelligence(self, rule: RoutingRule, event: UnifiedEvent) -> bool:
        tags = rule.conditions.get("gang_tags", [])
        payload_tags = event.raw_payload.get("gang_tags", [])
        return bool(tags and set(tags) & set(payload_tags))

    def _stolen_vehicle(self, _rule: RoutingRule, event: UnifiedEvent) -> bool:
        return bool(event.raw_payload.get("stolen"))

    def _suspicious_vehicle_pattern(self, rule: RoutingRule, event: UnifiedEvent) -> bool:
        min_hits = rule.conditions.get("min_hits", 3)
        return event.ai_enrichment.get("patterns", []).count("vehicle_activity") >= min_hits

    def _custom(self, rule: RoutingRule, event: UnifiedEvent) -> bool:
        expected_type = rule.conditions.get("event_type")
        return not expected_type or event.event_type == expected_type


rule_engine = AlertRuleEngine()
