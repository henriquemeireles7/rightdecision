# Input — Short-Video Viral Strategy (Doc #8)
**Date:** 2026-04-06
**Source:** Henry (founder), doc #7, doc #9, plan context
**Raw:** decisions/08-short-video-viral-strategy/raw.md

---

## Core philosophy

This is NOT about creating content. It's about building a machine that turns podcast recordings into distributed short-form video across 13 accounts with minimal human intervention. The competitive advantage is the pipeline itself — the system that compounds.

## Key decisions

1. **Custom Bun/TypeScript automation** — no n8n/Make.com/Zapier. Henry builds the pipeline as code. Full control, no vendor dependency. Fits the DSA architecture.
2. **$500/month budget ceiling** for tools (OpusClip, voice clone, auto-poster). ~5% of projected revenue.
3. **Dark channel niche TBD** — document should include selection criteria, not a chosen niche.
4. **Brand accounts = 100% AI from day 1** (from doc #7).
5. **Personal accounts = human → AI transition** (from doc #7). Timeline and quality gates needed.

## The pipeline (from user's original description)

The user described a folder-based system:
1. Upload podcast video into an `input/` folder
2. Auto-triggers one or many parallel workflows
3. Outputs go to the necessary folders
4. When files land in output folders, another automation generates descriptions, hashtags, etc.
5. Content is posted everywhere

The folders should be organized by accounts AND/OR per social platform — deciding which comes first is part of the design.

## From doc #7 (dependencies)

- 13 accounts across 5 platforms (TikTok, Instagram, Facebook, X, YouTube)
- Cross-posting adaptation matrix (doc #7, Section 5)
- Posting templates per platform (doc #7, Section 4)
- Content playbook: 60% awareness, 30% consideration, 10% conversion

## From doc #9 (dependencies)

- Podcast transcripts go in `decisions/podcasts/{type}/`
- Naming convention: `{YYYY-MM-DD}-{sequence}-{type}-{slug}.md`
- Four podcast types: general, vsl, the3acts, course

## Tools landscape (research needed in document)

- **Clip extraction:** OpusClip (AI clip scoring), CapCut (free, manual), Descript (transcript-based)
- **Voice cloning:** ElevenLabs, PlayHT, Resemble.ai
- **AI video generation:** HeyGen, Synthesia (avatars), RunwayML
- **Auto-posting:** Buffer, Publer, Later, Hootsuite, Social Bee. TikTok has limited API.
- **Transcription:** Whisper (free), Deepgram (fast/paid)
