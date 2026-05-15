# Technical Features Plan (Draft)

**Effective Date:** [To be set]

This document outlines the core technical features for fuxem.xyz, focusing on tagging, search, storage, CDN, and performer profiles.

## 1. Tagging & Categories
- Allow users to tag content with kinks, categories, and performer names.
- Support multi-select and custom tags for flexibility.
- Store tags in a dedicated database table for efficient querying.

## 2. Search & Discovery
- Implement full-text search for titles, descriptions, and tags.
- Enable filtering by category, performer, and popularity.
- Add sorting options (newest, most viewed, trending).
- Use Elasticsearch or PostgreSQL full-text search for scalability.

## 3. Storage & Media Delivery
- Store videos and images in S3-compatible storage (e.g., Wasabi, Bunny.net, Backblaze B2).
- Use signed URLs for secure, expiring access to media files.
- Regularly back up media to a secondary location.

## 4. CDN Integration
- Use a global CDN (e.g., Cloudflare, BunnyCDN) to deliver media quickly and reliably.
- Integrate CDN with storage for seamless delivery.
- Configure cache rules for privacy and performance.

## 5. Performer Profiles
- Allow performers to create and manage public profiles.
- Display their uploaded content, bio, and links.
- Support profile privacy settings (public/private, contact options).

## 6. Moderation Tools
- Build admin/moderator dashboards for reviewing flagged content.
- Enable bulk actions (approve, remove, ban).
- Log all moderation actions for auditability.

---

This is a draft. Please review with your technical team before implementation.
