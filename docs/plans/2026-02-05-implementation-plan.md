# DEADLINE SHELL 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 튜토리얼 → 커맨드 확장 → 랜덤 이벤트 → 메타 진행 → 맵 시스템 순서로 게임 완성

**Architecture:** 기존 Game.js 확장 + 모듈 분리 (Tutorial, Commands, Events, Meta, Map)

**Tech Stack:** Vanilla JS, Vite, DOM + Canvas

**언어 규칙:** 커맨드는 영어, 모든 설명/로그/힌트는 한글

---

## 전체 Phase 구성

| Phase | 내용 | 예상 시간 |
|-------|------|----------|
| 0 | 튜토리얼 시스템 (스토리 로그 + 힌트) | 30분 |
| 1 | 커맨드 확장 (repair, hide, lock 등) | 45분 |
| 2 | 랜덤 이벤트 시스템 | 30분 |
| 3 | 메타 진행 (DATA + 상점) | 45분 |
| 4 | 맵 연결 + 이동 제약 | 30분 |

---
