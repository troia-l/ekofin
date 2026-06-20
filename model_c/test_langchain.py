import os
import io
import sys
from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

class CodeGenerationStep(BaseModel):
    thought_process: str = Field(description="Nasıl hesaplanacağına dair düşünce zinciri adımları")
    python_code: str = Field(description="Hesaplamayı yapacak çalıştırılabilir Python kodu. Sadece kod, backtick olmadan.")

class FinalResult(BaseModel):
    answer: float = Field(description="Sonuc")
    decision: str = Field(description="Karar")

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"), temperature=0)

code_chain = (
    ChatPromptTemplate.from_messages([
        ("system", "Sen bir finansal analistsin. Verilen girdiye göre matematiksel hesaplama yapacak Python kodunu yaz. Kodu çalıştıracağımız için sadece python kodu ver, Markdown (```python) kullanma."),
        ("human", "{input}")
    ]) 
    | llm.with_structured_output(CodeGenerationStep)
)

final_chain = (
    ChatPromptTemplate.from_messages([
        ("system", "Sen bir sentezleyicisin. Kod çıktılarına bakarak nihai JSON formatını döndür."),
        ("human", "Girdi: {input}\nKod:\n{code}\nÇıktı:\n{output}")
    ])
    | llm.with_structured_output(FinalResult)
)

try:
    print("Step 1: Generating code...")
    user_input = "Eğer CAPEX 500000 TL ve Yıllık Tasarruf 120000 TL ise, amortisman süresini hesapla. 5 yıldan kısaysa ONAY, uzunsa RED ver."
    step1_res = code_chain.invoke({"input": user_input})
    print("Thought:", step1_res.thought_process)
    print("Code:\n", step1_res.python_code)
    
    print("\nStep 2: Executing code...")
    code = step1_res.python_code
    # clean markdown if any
    if code.startswith("```"):
        code = "\n".join(code.split("\n")[1:-1])
        
    old_stdout = sys.stdout
    sys.stdout = new_stdout = io.StringIO()
    exec_error = ""
    try:
        exec(code, {})
    except Exception as e:
        exec_error = str(e)
    finally:
        sys.stdout = old_stdout
        
    exec_output = new_stdout.getvalue()
    if exec_error:
        exec_output += f"\nError: {exec_error}"
        
    print("Output:\n", exec_output)
    
    print("\nStep 3: Synthesizing final result...")
    final_res = final_chain.invoke({
        "input": user_input,
        "code": code,
        "output": exec_output
    })
    
    print("Final:", final_res.dict())
except Exception as e:
    print("Pipeline Error:", e)

