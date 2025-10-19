# Property Management QA Testing

This directory contains comprehensive QA testing tools for the Property Management system.

## Files

1. **`qa-property-test.md`** - Manual testing checklist
2. **`qa-property-automated.ts`** - Automated code quality checks
3. **`QA-README.md`** - This file

---

## Quick Start

### Option 1: Run Automated Tests

```bash
# From project root
npx ts-node qa-property-automated.ts
```

This will:
- ✅ Check file structure
- ✅ Analyze code patterns
- ✅ Detect common anti-patterns
- ✅ Check for performance issues
- ✅ Generate a detailed report

**Output:** Creates `qa-report.json` with all results

### Option 2: Manual Testing

Follow the step-by-step checklist in `qa-property-test.md`:
1. Open the file
2. Follow each test case
3. Check boxes as you complete them
4. Document any issues found

---

## What the Automated Tests Check

### ✅ File Structure
- All required files exist
- Components are in correct locations

### ✅ Code Patterns
- Property is memoized to prevent re-renders
- transformedVendorData has correct dependencies
- Form reset only depends on property ID
- Steps array is memoized
- No stray return statements in useMemo

### ✅ Component Integration
- Room component has null safety
- EPCRatingSelect uses native select
- No duplicate setValue calls
- Proper FormData handling

### ✅ Schema Validation
- propertyStatus enum defined correctly
- propertyFeature handles arrays
- Redux slice supports propertyStatus

### ✅ Anti-patterns
- No {...register} on Radix UI components
- No multiple setValue for same field
- No empty useEffect dependencies with used variables

### ✅ Performance
- Console.log count is reasonable
- Steps array is memoized
- No infinite re-render patterns

---

## Expected Test Results

### Good Output Example:
```
✅ Property Memoization: Property is properly memoized
✅ Form Reset Dependencies: Form reset only depends on property ID
✅ Steps Memoization: Steps array is memoized
✅ EPC Rating Component: Uses native select with proper registration
✅ Room Null Safety: Room component has null safety checks

📊 QA TEST SUMMARY
Total Tests: 45
✅ Passed: 43
❌ Failed: 0
⚠️  Warnings: 2

Pass Rate: 95.6%
✅ All critical tests passed. Review warnings for improvements.
```

### Issues to Fix:
If you see failures like:
```
❌ Steps Memoization: Steps should be memoized to prevent child remounting
❌ EPC Rating SetValue: Remove duplicate setValue from onChange handlers
❌ PropertyStatus Enum: propertyStatus should have DRAFT and PUBLISHED enum values
```

These need immediate attention!

---

## Manual Testing Workflow

### 1. Setup
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev

# Open browser console
```

### 2. Test Draft Functionality
- [ ] Create property → Save as Draft on Step 1
- [ ] Verify no validation errors
- [ ] Edit draft → Make changes → Save
- [ ] Verify changes persist

### 3. Test EPC Ratings (Current Focus)
- [ ] Edit property
- [ ] Navigate to Photos/Floor/FPC Plan
- [ ] Change "Current Energy Efficiency Rating"
- [ ] Change "Potential Energy Efficiency Rating"
- [ ] Navigate to next step and back
- [ ] **Verify values persist and display correctly**

**Console should show:**
```
✏️ EPCRatingSelect [potentialEERating] changed to: 5
🎯 EditProperty Form - Field potentialEERating changed: 5
```

**Should NOT show repeatedly:**
```
🔄 transformedVendorData useMemo recalculating...
🔄 RESETTING FORM
```

### 4. Test Published Properties
- [ ] Edit published property
- [ ] Verify NO "Save as Draft" button
- [ ] Make changes
- [ ] Verify status stays "PUBLISHED"

---

## Known Fixed Issues ✅

These issues have been resolved:

1. ✅ **Save as Draft not hitting API** - Validation now skipped for drafts
2. ✅ **propertyFeature: Expected array, received string** - Schema updated
3. ✅ **propertyStatus sent as array** - Fixed to send as single string
4. ✅ **rooms: Expected array, received string** - Parsing logic added
5. ✅ **EPC ratings not editable** - Created EPCRatingSelect component
6. ✅ **Form resetting on every change** - Property memoization added
7. ✅ **Steps remounting** - Steps array memoized
8. ✅ **Room component TypeError** - Null safety checks added

---

## Current Issue Being Debugged 🔍

**Issue:** EPC rating values change in form state but UI doesn't update

**Debug Logs Added:**
- `🏠 Property memoization recalculating`
- `🔄 transformedVendorData useMemo recalculating`
- `🔄 RESETTING FORM` or `⏭️ Skipping reset`
- `🏷️ EPCRatingSelect [name] render`
- `✏️ EPCRatingSelect [name] changed to`
- `🎯 EditProperty Form - Field changed`
- `📸 PhotosFloorFPCPlan component rendering`
- `📊 EPC Values in PhotosFloorFPCPlan`

**To Fix:**
1. Run the automated test: `npx ts-node qa-property-automated.ts`
2. Follow manual test for EPC ratings in `qa-property-test.md`
3. Check console logs for patterns
4. Share results for further debugging

---

## Reporting Issues

When you find an issue, document:

```markdown
**Issue:** [Description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** [What should happen]
**Actual:** [What happens instead]

**Console Logs:**
```
[Paste relevant console output]
```

**Network Tab:**
[Screenshot or description of API calls]

**Severity:** Critical / High / Medium / Low
```

---

## Success Criteria

### All Tests Pass When:
- ✅ Automated tests show 100% pass rate
- ✅ All manual test cases complete successfully
- ✅ EPC ratings are fully editable
- ✅ Draft functionality works on all steps
- ✅ No data loss when editing
- ✅ No console errors
- ✅ API calls succeed with correct payloads
- ✅ Published properties can't revert to draft

---

## Next Steps

1. **Run automated test**: `npx ts-node qa-property-automated.ts`
2. **Fix any failures** shown in the report
3. **Run manual tests** from `qa-property-test.md`
4. **Test EPC ratings specifically** - current focus
5. **Verify all fixes** are working
6. **Remove debug console.logs** before production

---

## Contact

If you encounter issues or need clarification, document them using the issue template above.

**Last Updated:** 2025-10-18
**Version:** 1.0
**Status:** Active Development - EPC Rating Issue Debugging

