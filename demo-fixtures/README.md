# Data fixtures

The included `src/data/demo-report.ts` is *synthetic* and openly labeled as such throughout the dashboard. It exists to let the team demo every UI feature without an API key. Its example events (including a pump maintenance NPT period) are inventions, NOT verified facts about the DOE Utah FORGE well.

For genuine source-based demos, P1 should fetch official historical Utah FORGE 78B-32 reports from https://gdr.openei.org/submissions/1330 and manually verify individual page citations and event dates. Source files are **not included** in this package. The team should review repository terms prior to redistributing real PDFs.

Recommended P1 test record: `sourceOriginalFilename`, `sourceUrl`, `wellName`, `reportDate`, `checkedPage`, `exactShortSnippet`, `humanVerifiedBy`, `notes`; never claim event details merely because a model parsed them.
