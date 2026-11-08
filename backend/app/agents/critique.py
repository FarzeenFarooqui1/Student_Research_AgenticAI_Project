import os
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()


class CritiqueResult(BaseModel):
    paper_title: str
    overall_quality_score: int = Field(..., description="Score from 1 (poor) to 10 (exceptionally robust)")
    methodological_flaws: List[str] = Field(default_factory=list, description="Key weaknesses in study design or execution")
    potential_biases: List[str] = Field(default_factory=list, description="Conflicts of interest, sample bias, or missing baselines")
    student_takeaway: str = Field(..., description="How a student should interpret or cite this paper carefully")


class CritiqueAgent:
    def __init__(self, model_name: str = "gpt-4o-mini"):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("[WARNING] OPENAI_API_KEY not found in environment!")
            
        self.llm = ChatOpenAI(model=model_name, temperature=0.2)
        # Force structured Pydantic output from OpenAI
        self.structured_llm = self.llm.with_structured_output(CritiqueResult)

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an expert academic critique agent designed to help university students evaluate research papers.\n"
                "Analyze the provided paper details (title and abstract) critically.\n"
                "Identify potential methodological flaws, missing baselines, sample size issues, or unstated assumptions.\n"
                "Be objective, rigorous, and clear."
            )),
            ("user", (
                "Paper Title: {title}\n"
                "Abstract: {abstract}\n\n"
                "Provide a structured critique of this paper."
            ))
        ])

    async def analyze_paper(self, title: str, abstract: Optional[str]) -> CritiqueResult:
        """Runs the LLM pipeline to produce a structured critique of a paper."""
        if not abstract:
            abstract = "No abstract provided."

        chain = self.prompt | self.structured_llm
        result: CritiqueResult = await chain.ainvoke({
            "title": title,
            "abstract": abstract
        })
        return result


# CLI test block
if __name__ == "__main__":
    import asyncio

    async def test_critique():
        agent = CritiqueAgent()
        print("Testing Critique Agent...")
        
        sample_title = "Evaluating Multi-Agent AI Systems in Autonomous Tasks"
        sample_abstract = (
            "We evaluated our agentic framework on 10 synthetic benchmark tasks. "
            "Our system achieved 95% accuracy compared to a single prompt baseline. "
            "No human baseline or statistical significance testing was performed."
        )

        try:
            critique = await agent.analyze_paper(sample_title, sample_abstract)
            print(f"\n--- Critique Output for: {critique.paper_title} ---")
            print(f"Quality Score: {critique.overall_quality_score}/10")
            print("\nMethodological Flaws:")
            for flaw in critique.methodological_flaws:
                print(f"  - {flaw}")
            print("\nPotential Biases:")
            for bias in critique.potential_biases:
                print(f"  - {bias}")
            print(f"\nStudent Takeaway:\n{critique.student_takeaway}")
        except Exception as e:
            print(f"Error running Critique Agent: {e}")

    asyncio.run(test_critique())