/**
 * Honest "no test definition" state, ported from showrunner-scoring.html's
 * `testWarningBannerHtml` — shown instead of scoring against a placeholder
 * when neither `class_tests` nor the class's scoring-catalog match resolved
 * a real test.
 */
export function NotARealTestBanner() {
  return (
    <div className="rounded-xl border border-[#E3B8B8] bg-[#F7E1E1] p-[16px_18px] text-[13.5px] text-[#8E3627]">
      <strong className="font-semibold">Not a real test.</strong> This class has no scoring
      definition yet — an organizer needs to attach one from the Scoring Catalog before marks can
      be entered here.
    </div>
  );
}
