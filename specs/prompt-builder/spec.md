# Prompt Builder

## Room Type Expansion

### Goal

Support more residential spaces for interior image generation.

### New Room Types

- Basement
- Home Office
- Home Gym
- Theater Room
- Pantry
- Laundry Room

### Requirements

- New room types must appear in the Room Type selector.
- New room types must be available to prompt generation.
- New room types must work with batch generation.
- Existing room types remain unchanged.

### Future Direction

Room types may eventually be grouped into categories:

- Living Spaces
- Private Spaces
- Service Spaces
- Entertainment Spaces
- Fitness Spaces
- Utility Spaces

Do not implement categories yet unless specifically requested.

### Acceptance Criteria

- User can select each new room type.
- Generated prompts correctly include the selected room type.
- Batch generation includes the new room types.
- No existing room types are removed.
