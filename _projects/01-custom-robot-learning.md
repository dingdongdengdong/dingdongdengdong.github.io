---
layout: page
title: Custom Robot Learning Platform
description: VR teleoperation, imitation learning, and VLA research on a custom 5-DoF manipulator with AmazingHand.
importance: 1
category: research
related_publications: false
---

## Goal

Build an end-to-end robot-learning workflow for a non-standard custom manipulator rather than relying on a benchmark robot platform.

## System

**Meta Quest 2 → WebXR / pose mapping → IK + safety constraints → 5-DoF arm + AmazingHand**

The same control pipeline is designed to connect to both physical hardware and simulation so demonstrations and policies can be evaluated across embodiments.

## Current pipeline

1. Model the custom arm and dexterous hand with URDF / simulation assets.
2. Teleoperate the manipulator using Meta Quest 2.
3. Validate workspace, joint limits, IK, clutching, and safety behavior.
4. Record demonstrations in a LeRobot-compatible representation.
5. Train and evaluate ACT / VLA-style manipulation policies.
6. Transfer the learned behavior to the physical robot.

## Engineering focus

- Custom robot abstraction rather than a standard LeRobot embodiment
- Isaac Sim and MuJoCo validation
- VR teleoperation and demonstration collection
- Arm + hand action representation
- Jetson / physical robot deployment path

**Code:** [VR teleoperation](https://github.com/dingdongdengdong/robot_arm_vr) · [Robot integration](https://github.com/dingdongdengdong/superarm_ws)
