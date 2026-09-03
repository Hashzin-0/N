# Plan: Cell Division Animation - Slider from Left

## Goal
Change the cell division animation so the second input appears to emerge from the LEFT side of Input1, making it look like Input1 is dividing/multiplicando a si mesmo (dividing/multiplying itself to become 2).

## Current Behavior
- Layout: `[Input1 (48%)] [Bridge (60px)] [Input2 (48%)]`
- Input1 shrinks from 100% to 48% (right side shrinks)
- Input2 appears on the RIGHT side (expands from 0 to 48%)
- Clip-path reveals Input2 from left to right

## Desired Behavior
- Layout: `[Input2 (48%)] [Bridge (60px)] [Input1 (48%)]`
- Input2 emerges from the LEFT side of Input1 (as if Input1 is splitting)
- Input2 expands from 0 to 48% on the LEFT
- Input1 shrinks from 100% to 48% on the RIGHT

## Changes Required

### File: `/workspaces/N/components/CellDivisionContainer.tsx`

1. **Change layout order** (lines 264-322)
   - Move Input2 BEFORE Input1 in the JSX
   - Keep Bridge in the middle

2. **Update clip-path animation for Input2** (lines 306-316)
   - Current: `inset(0 100% 0 0)` → `inset(0 0% 0 0)` (reveals left to right)
   - New: `inset(0 0 0 100%)` → `inset(0 0 0 0)` (reveals right to left)

3. **Update blob glow on Input2** (lines 291-303)
   - Change from LEFT edge to RIGHT edge (where it connects to bridge)
   - Update className: `left-0` → `right-0`
   - Update gradient: `linear-gradient(270deg, ...)` → `linear-gradient(90deg, ...)`
   - Update borderRadius: `${innerRadius}px 0 0 ${innerRadius}px` → `0 ${innerRadius}px ${innerRadius}px 0`

4. **Update blob glow on Input1** (lines 131-143)
   - Change from RIGHT edge to LEFT edge (where it connects to bridge)
   - Update className: `right-0` → `left-0`
   - Update gradient: `linear-gradient(90deg, ...)` → `linear-gradient(270deg, ...)`
   - Update borderRadius: `0 ${innerRadius}px ${innerRadius}px 0` → `${innerRadius}px 0 0 ${innerRadius}px`

5. **Update Input2 border radius** (lines 271-276)
   - Change from LEFT to RIGHT radius
   - `borderTopLeftRadius: innerRadius` → `borderTopRightRadius: innerRadius`
   - `borderBottomLeftRadius: innerRadius` → `borderBottomRightRadius: innerRadius`

6. **Update Input1 border radius** (lines 117-119)
   - Change from RIGHT to LEFT radius
   - `borderTopRightRadius: innerRadius` → `borderTopLeftRadius: innerRadius`
   - `borderBottomRightRadius: innerRadius` → `borderBottomLeftRadius: innerRadius`

7. **Update rotateX values** (lines 120, 276)
   - Input1: `isSliding ? -1 : isMerging ? 0.5 : 0` → `isSliding ? 1 : isMerging ? -0.5 : 0`
   - Input2: `isSliding ? 1 : isMerging ? -0.5 : 0` → `isSliding ? -1 : isMerging ? 0.5 : 0`

## Verification
- Run `npm run dev` and test the animation
- Verify Input2 appears to emerge from the LEFT side of Input1
- Verify the merge animation (switching back to single mode) still works correctly
- Verify all three instances of CellDivisionContainer in page.tsx work correctly