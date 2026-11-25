---
title: Model configuration
description: Use Garwoo’s official AI service, an OpenAI-compatible endpoint, or local Ollama.
---

## Official AI

Garwoo’s official AI service requires an account and credits. On first use, confirm an allowance of 30 credits by default. Questions and drafting share that allowance, with credits deducted based on actual usage. Unused credits are returned after 15 minutes of inactivity or when you end the session.

Questions are billed by token usage. AI-guided ontology drafting uses about 3–8 credits per draft. Cloud OCR uses about 0.5 credits per scanned page. The figures on the [pricing page](/pricing/) are examples. Registration and purchases are currently closed.

## Use your own model

Requests to an OpenAI-compatible endpoint or local Ollama go directly to the configured address. They bypass the Garwoo gateway and use no Garwoo credits. Available capabilities depend on your model.

The free client can use your own model for agents and scheduled tasks.

## Enterprise

[Garwoo Enterprise](/enterprise/) can connect to models your organization runs with vLLM, Ollama, or a comparable local serving platform.
