import os
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()


class OutcomeExtraction(BaseModel):
    outcome_domain: str = Field(..., description="Category of the outcome (e.g., Performance, Accuracy, Cost, Efficiency)")
    outcome_metric: str = Field(..., description="Specific metric measured (e.g., F1-Score, Latency, Yield)")
    outcome_value: float = Field(..., description="Numeric value reported, or 0 if qualitative/trend")
    outcome_unit: str = Field(..., description="Unit of measurement (e.g., %, ms, USD, scale 1-10)")
    response_direction: str = Field(..., description="Positive, negative, neutral, or non-monotonic")


class ConditionExtraction(BaseModel):
    condition_id: str = Field(..., description="Identifier for the experimental condition or variant tested")
    experimental_setup: str = Field(..., description="The dataset, environment, or matrix being tested")
    intervention_or_parameter: str = Field(..., description="The parameter, dose, model size, or treatment applied")
    outcomes: List[OutcomeExtraction]


class EvidenceExtractionResult(BaseModel):
    study_id: str = Field(..., description="First author name and year, e.g., Smith_2025")
    year: int
    primary_objective: str = Field(..., description="The main research question or objective of the paper")
    conditions: List[ConditionExtraction]
    key_limitations_or_gaps: List[str] = Field(
        ..., description="Methodological limitations, missing baselines, or unaddressed biases"
    )


class EvidenceMapperAgent:
    def __init__(self, model_name: str = "gpt-4o"):
        self.llm = ChatOpenAI(model=model_name, temperature=0.0)
        self.structured_llm = self.llm.with_structured_output(EvidenceExtractionResult)

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are a universal academic meta-analysis and evidence-mapping agent.\n"
                "Your job is to read any research paper text (regardless of field: AI, biology, economics, physics, etc.) "
                "and extract structured experimental conditions, parameters tested, and quantitative outcome metrics into a clean matrix.\n"
                "Adapt dynamically to the domain—do not assume ozone or chemistry terminology."
            )),
            ("user", "Extract structured evidence mapping records from this paper text:\n\n{paper_text}")
        ])

    async def map_evidence(self, paper_text: str) -> EvidenceExtractionResult:
        chain = self.prompt | self.structured_llm
        return await chain.ainvoke({"paper_text": paper_text})