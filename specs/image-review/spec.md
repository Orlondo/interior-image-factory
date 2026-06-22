# Image Review

## Goal

Define the image review experience and criteria for evaluating generated interiors.

## Problem

A structured review flow is needed to assess image quality, style fidelity, and concept suitability consistently.

## Requirements

### Review Scope

- Support reviewing generated interior images from a batch.
- Preserve room type, design style, and quality context during review.
- Enable side-by-side or sequential evaluation of multiple outputs.

### Evaluation Criteria

- Style consistency
- Room type correctness
- Composition quality
- Lighting realism
- Material realism
- Palette suitability

### Decision Outcomes

- Approve
- Reject
- Needs revision

## Rapid Image Review

### Goal

Allow users to quickly review large batches of generated images.

### Requirements

- Clicking an image opens a review modal.
- Modal displays a large version of the image.
- Previous and Next navigation.
- Keyboard navigation support.
- Current image position indicator.

Example:

3 of 12

### Acceptance Criteria

- Users can review an entire batch without returning to the grid.
- Arrow keys navigate between images.
- Esc closes the modal.

## Acceptance Criteria

- Reviewers can evaluate all images in a generated batch.
- Review outcomes are consistent and repeatable.
- Image selection decisions can be made without ambiguity.
