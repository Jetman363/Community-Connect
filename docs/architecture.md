# Platform Architecture (MVP)

## Architectural Principles

- Microservices-first decomposition with bounded contexts
- API-first contracts (OpenAPI + GraphQL schema)
- Event-driven integration for async workflows
- Zero-trust network and identity boundaries
- CJIS-aligned audit, encryption, and access control

## Core Runtime Components

- API Gateway: request routing, auth propagation, GraphQL federation shell
- Auth Service: identity, tokens, sessions, user/role management
- RMS Service: incident report lifecycle
- AI Report Service: LLM orchestration + human approval workflow
- Audit Service: append-only audit event capture
- Notification Service: workflow and operational messaging
- Entity Linking Service: basic investigative relationship intelligence
- Event Bus Layer: versioned domain events via pluggable publisher contract

## Data Tier

- PostgreSQL: transactional records (users, reports, cases)
- Neo4j: relationship intelligence graph
- OpenSearch: full-text and faceted search
- Weaviate/Pinecone: vector search for semantic retrieval
- Redis: caching, short-lived queues, rate limiting

## Compliance Foundations

- Immutable audit model with hash chaining ready extension
- Role + attribute policy evaluation points in gateway and services
- Evidence access constrained via policy context
- Human-in-the-loop required for AI-generated report finalization
- Tamper-evident audit hash chain (`prev_hash` + record hash)
