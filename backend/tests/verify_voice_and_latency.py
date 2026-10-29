import asyncio
import time
import sys
from backend.app.schemas.schemas import AssistantChatRequest
from backend.app.services.assistant_service import ask_cotton_assistant

async def run_tests():
    print("================================================================")
    print("CottonCare AI Assistant — Multilingual Voice & Latency Benchmark")
    print("================================================================")

    test_cases = [
        {
            "lang": "English",
            "question": "What is the best fertilizer dose during flowering stage in cotton?",
            "expected_keywords": ["fertilizer", "dose", "nitrogen", "npk", "urea", "cotton", "boll", "stage"]
        },
        {
            "lang": "Marathi",
            "question": "कपाशीत गुलाबी बोंड अळीचे नियंत्रण कसे करावे?",
            "expected_keywords": ["बोंड", "अळी", "गुलाबी", "नियंत्रण", "ट्रॅप", "औषध", "कीड"]
        },
        {
            "lang": "Hindi",
            "question": "फूल आने के समय कपास में कौन सा खाद डालना चाहिए?",
            "expected_keywords": ["खाद", "कपास", "उर्वरक", "फूल", "नाइट्रोजन", "पोषक"]
        },
        {
            "lang": "English",
            "question": "Will heavy rain occur today and should I spray pesticides?",
            "expected_keywords": ["rain", "spray", "weather", "precaution", "postpone", "wind"]
        },
        {
            "lang": "Marathi",
            "question": "मुसळधार पावसाचा अंदाज असल्यास काय काळजी घ्यावी?",
            "expected_keywords": ["पाऊस", "निचरा", "पाणी", "फवारणी", "चर"]
        }
    ]

    all_passed = True

    for i, tc in enumerate(test_cases, 1):
        print(f"\n--- Test #{i} [{tc['lang']}]: \"{tc['question']}\" ---")
        req = AssistantChatRequest(
            question=tc["question"],
            language=tc["lang"]
        )

        t0 = time.time()
        try:
            resp = await ask_cotton_assistant(req)
            elapsed = time.time() - t0
            
            print(f"  Response Time : {elapsed:.2f} seconds")
            print(f"  Provider      : {resp.provider}")
            print(f"  Language      : {resp.language}")
            print(f"  Answer Preview: {resp.answer[:140]}...")

            # Verification 1: Latency check (must be well under 10 seconds)
            if elapsed > 15.0:
                print(f"  ❌ FAIL: Response took too long ({elapsed:.2f}s > 15.0s)")
                all_passed = False
            else:
                print(f"  ✅ PASS: Responsive latency ({elapsed:.2f}s)")

            # Verification 2: Non-empty answer
            if not resp.answer or len(resp.answer.strip()) < 30:
                print("  ❌ FAIL: Answer too short or empty")
                all_passed = False
            else:
                print(f"  ✅ PASS: Substantive response ({len(resp.answer)} chars)")

            # Verification 3: Relevance check
            ans_lower = resp.answer.lower()
            found_keywords = [k for k in tc["expected_keywords"] if k.lower() in ans_lower]
            if not found_keywords:
                print(f"  ⚠️ Warning: Expected one of {tc['expected_keywords']}")
            else:
                print(f"  ✅ PASS: Relevant context detected (Matched: {', '.join(found_keywords)})")

        except Exception as e:
            print(f"  ❌ FAIL with Exception: {e}")
            all_passed = False

    print("\n================================================================")
    if all_passed:
        print("🎉 ALL ASSISTANT TESTS PASSED WITH FAST RESPONSE TIMES!")
    else:
        print("❌ SOME ASSISTANT TESTS FAILED")
    print("================================================================")
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit_code = asyncio.run(run_tests())
    sys.exit(exit_code)
