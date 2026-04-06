# Ops — Internal Tools + Automation

> Last verified: 2026-04-06
> Deep dive: decisions/07-social-media-setup/, decisions/08-short-video-viral-strategy/ (when created)

## Strategy
Build internal tools that automate distribution. The file system is the database for v1. Upgrade to proper DB when scale demands it.

## Social Media Pipeline
- 13 accounts: 3 TikTok, 3 Instagram, 3 Facebook, 3 X, 1 YouTube
- Automated posting via OpusClip + AI-generated content
- Dark channel concept: fully AI-automated secondary platforms
- Podcast → clips → auto-captioning → batch scheduling

## Content Automation
- Short-video: raw footage → OpusClip → auto-captions → multi-platform post
- Blog: SEO + GEO optimized articles → auto-publish
- Social: content pillars from manifesto angles → scheduled posts

## Deployment
Separate Railway service from main product:
- Subdomain: ops.therightdecision.com
- Own Dockerfile, own database
- Internal access only (no customer-facing)
- Future: could become sellable product (upsell)

## Current Status
Not yet built. Strategy defined in docs 7-9. Build after landing page + course MVP.
