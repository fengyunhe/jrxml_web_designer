## Problem Analysis
The TableElement component currently renders columns directly from the `tableElement.columns` array, but when columns are grouped using the "Add Columns to Group" feature, they're moved to the `tableElement.children` array as a hierarchical structure of ColumnGroup objects. This means column groups are not visually represented in the design area.

## Solution Plan
1. **Update TableElement.vue to handle hierarchical structure**:
   - Modify the computed `columns` property to use `tableElement.children` when available
   - Create a recursive rendering function/component to display column groups
   - Update table header/footer rendering to show group headers

2. **Implement recursive column/group rendering**:
   - Create a helper function to flatten groups for column selection functionality
   - Update column selection logic to work with hierarchical structure
   - Ensure context menu works correctly for grouped columns

3. **Update template structure**:
   - Modify table header section to render group headers spanning multiple columns
   - Ensure group columns are visually distinct with proper styling
   - Maintain backward compatibility with existing flat column structures

4. **Test the implementation**:
   - Verify column grouping works correctly
   - Ensure group headers are displayed properly
   - Test column selection across groups
   - Verify context menu functionality still works

## Key Changes
- File: `src/components/elements/TableElement.vue` - Update to handle hierarchical column structure
- Add recursive rendering logic for column groups
- Modify column selection and context menu handling
- Update template to display group headers

## Expected Outcome
After implementation, when users group columns using the context menu, the grouped columns will be visually represented in the design area with collapsible/expandable group headers, making the grouping structure clear and editable.