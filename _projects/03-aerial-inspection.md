---
layout: page
title: Aerial Sim-to-Real Inspection
description: Synthetic-data-driven infrastructure inspection using Isaac Sim, PX4/ROS2, perception, and Jetson.
importance: 3
category: research
related_publications: false
---

## Problem

Real crack and corrosion data from industrial structures is expensive and difficult to collect at scale. This project explores whether simulation and synthetic data can accelerate development before full real-world data collection is available.

## Pipeline

**Isaac Sim / Replicator → synthetic defect data → perception model → ROS2 / PX4 integration → Jetson edge deployment → real-world validation**

## Current work

- Crane / infrastructure simulation scenes
- Synthetic defect data generation and domain randomization
- PX4 SITL + MAVROS / ROS2 integration
- Defect perception pipeline
- TensorRT / Jetson deployment path
- Sim-to-real evaluation

This is an ongoing R&D project, so the portfolio distinguishes completed infrastructure from planned validation milestones.

[Project repository](https://github.com/dingdongdengdong/aerial-crane-inspection)
