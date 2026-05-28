from fastapi import FastAPI

app = FastAPI(title="Entity Linking Service", version="0.1.0")


@app.post("/v1/link")
async def link_entities(payload: dict) -> dict:
    entities = payload.get("entities", [])
    links = []
    for idx in range(max(0, len(entities) - 1)):
        links.append({"source": entities[idx], "target": entities[idx + 1], "relation": "associated_with"})
    return {"links": links}
