from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

from app.tools.semantic_scholar import SemanticScholarClient, Paper
from app.agents.critique import CritiqueAgent, CritiqueResult
from app.agents.evidence_mapper import EvidenceMapperAgent, EvidenceExtractionResult  # <-- Updated name

app = FastAPI(
    title="Student Research Agent API",
    description="Agentic backend for searching literature, analyzing flaws, and accelerating student research.",
    version="1.0.0"
)

# Enable CORS for local Next.js / frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize singletons
scholar_client = SemanticScholarClient()
critique_agent = CritiqueAgent()
evidence_mapper_agent = EvidenceMapperAgent()


class SearchResponse(BaseModel):
    query: str
    count: int
    papers: List[Paper]


class CritiqueRequest(BaseModel):
    title: str = Field(..., description="Title of the paper")
    abstract: Optional[str] = Field(None, description="Abstract of the paper")


class EvidenceRequest(BaseModel):
    paper_text: Optional[str] = Field(None, description="Raw abstract or text of the research paper")
    title: Optional[str] = Field(None, description="Title fallback")
    abstract: Optional[str] = Field(None, description="Abstract fallback")

@app.get("/")
async def root():
    return {"status": "online", "message": "Student Research Agent Backend is running."}


@app.get("/api/search", response_model=SearchResponse)
async def search_literature(query: str, limit: int = 5):
    """Search for academic papers using Semantic Scholar."""
    try:
        papers = await scholar_client.search_papers(query=query, limit=limit)
        return SearchResponse(
            query=query,
            count=len(papers),
            papers=papers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/critique", response_model=CritiqueResult)
async def critique_paper(request: CritiqueRequest):
    """Run the Critique Agent on a given paper title and abstract."""
    try:
        result = await critique_agent.analyze_paper(
            title=request.title,
            abstract=request.abstract
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/map-evidence", response_model=EvidenceExtractionResult)
async def map_paper_evidence(request: EvidenceRequest):
    """Extract a structured evidence map from paper text, handling multiple payload formats gracefully."""
    try:
        # Combine whatever fields the frontend sent
        text_to_analyze = request.paper_text
        if not text_to_analyze:
            text_to_analyze = f"Title: {request.title or 'Unknown'}\n\nAbstract: {request.abstract or 'No abstract provided.'}"

        result = await evidence_mapper_agent.map_evidence(paper_text=text_to_analyze)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))